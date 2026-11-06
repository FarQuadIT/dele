<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Notification;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function show(Request $request)
    {
        $member = OrganizationMember::where('userId', $request->user()->id)->with('organization')->oldest('createdAt')->first();

        return Inertia::render('contractor/company', ['org' => $member?->organization]);
    }

    public function store(Request $request)
    {
        $member = OrganizationMember::where('userId', $request->user()->id)->with('organization')->oldest('createdAt')->first();
        abort_if($member && ! in_array($member->role, ['OWNER', 'MANAGER']), 403);
        $org = $member?->organization;
        $data = $request->validate([
            'name' => 'required|string|min:2|max:160', 'inn' => ['nullable', 'regex:/^\d{10}(\d{2})?$/', Rule::unique('Organization', 'inn')->ignore($org?->id)],
            'description' => 'nullable|string|max:2000', 'phone' => 'nullable|string|max:30', 'email' => 'nullable|email|max:254', 'website' => 'nullable|string|max:200',
            'specializations' => 'array', 'specializations.*' => Rule::in(config('dele.enums.SystemType')), 'regionsServed' => 'nullable|string|max:300',
        ]);
        $data['regionsServed'] = array_values(array_filter(array_map('trim', explode(',', $data['regionsServed'] ?? ''))));
        $data['specializations'] = $data['specializations'] ?? [];
        $data['verificationStatus'] = $org?->verificationStatus === 'VERIFIED' ? 'VERIFIED' : 'PENDING';
        $saved = DB::transaction(function () use ($request, $org, $data) {
            // Serialize company creation by user; retries cannot create two memberships.
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! $org) {
                abort_if(OrganizationMember::where('userId', $request->user()->id)->exists(), 409, 'Компания уже создана. Обновите страницу.');
            }
            if ($org) {
                $org->update($data);

                return $org;
            }
            $org = Organization::create([...$data, 'slug' => (Str::slug($data['name']) ?: 'org').'-'.Str::lower(Str::random(8))]);
            OrganizationMember::create(['organizationId' => $org->id, 'userId' => $request->user()->id, 'role' => 'OWNER', 'position' => 'Руководитель']);
            AuditEvent::create(['actorId' => $request->user()->id, 'action' => 'organization.create', 'entity' => 'Organization', 'entityId' => $org->id, 'meta' => ['name' => $org->name]]);

            return $org;
        });

        return response()->json(['ok' => true, 'data' => ['id' => $saved->id]]);
    }

    public function index(Request $request)
    {
        $status = $request->query('status');
        abort_if($status && ! in_array($status, config('dele.enums.OrgVerificationStatus')), 422);
        $companies = Organization::when($status, fn ($q) => $q->where('verificationStatus', $status))->with(['members' => fn ($q) => $q->where('role', 'OWNER')->with('user')])->withCount(['offers', 'orders'])->orderBy('verificationStatus')->latest('createdAt')->get();

        return Inertia::render('admin/companies', ['status' => $status, 'pendingCount' => Organization::where('verificationStatus', 'PENDING')->count(),
            'companies' => $companies->map(function ($c) {
                $d = $c->toArray();
                $d['_count'] = ['offers' => $c->offers_count, 'orders' => $c->orders_count];

                return $d;
            })]);
    }

    public function moderate(Request $request)
    {
        $data = $request->validate(['organizationId' => 'required|string', 'decision' => ['required', Rule::in(['VERIFIED', 'REJECTED'])], 'note' => 'nullable|string|max:500']);
        DB::transaction(function () use ($request, $data) {
            $org = Organization::lockForUpdate()->findOrFail($data['organizationId']);
            $org->update(['verificationStatus' => $data['decision'], 'verifiedAt' => $data['decision'] === 'VERIFIED' ? now() : null, 'verificationNote' => $data['note'] ?? null]);
            $owner = $org->members()->where('role', 'OWNER')->first();
            if ($owner) {
                Notification::create(['userId' => $owner->userId, 'kind' => 'SYSTEM', 'title' => $data['decision'] === 'VERIFIED' ? 'Компания подтверждена' : 'Компания отклонена модерацией', 'body' => $data['note'] ?? $org->name, 'href' => '/app/contractor/company']);
            }
            AuditEvent::create(['actorId' => $request->user()->id, 'action' => $data['decision'] === 'VERIFIED' ? 'organization.verify' : 'organization.reject', 'entity' => 'Organization', 'entityId' => $org->id, 'meta' => ['name' => $org->name, 'note' => $data['note'] ?? null]]);
        });

        return response()->json(['ok' => true]);
    }
}
