<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('User', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('email')->unique();
            $table->text('phone')->nullable()->unique();
            $table->text('passwordHash');
            $table->text('name');
            $table->text('avatarUrl')->nullable();
            $table->enum('role', ['CUSTOMER', 'CONTRACTOR', 'ADMIN'])->default('CUSTOMER');
            // UserRole: CUSTOMER, CONTRACTOR, ADMIN
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('Account', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('userId');
            $table->text('type');
            $table->text('provider');
            $table->text('providerAccountId');
            $table->text('refresh_token')->nullable();
            $table->text('access_token')->nullable();
            $table->integer('expires_at')->nullable();
            $table->text('token_type')->nullable();
            $table->text('scope')->nullable();
            $table->text('id_token')->nullable();
            $table->text('session_state')->nullable();
            $table->unique(['provider', 'providerAccountId']);
        });
        Schema::create('Session', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('sessionToken')->unique();
            $table->text('userId');
            $table->timestamp('expires');
        });
        Schema::create('VerificationToken', function (Blueprint $table) {
            $table->text('identifier');
            $table->text('token')->unique();
            $table->timestamp('expires');
            $table->unique(['identifier', 'token']);
        });
        Schema::create('Organization', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('name');
            $table->text('slug')->unique();
            $table->text('inn')->nullable()->unique();
            $table->text('description')->nullable();
            $table->text('logoUrl')->nullable();
            $table->text('website')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->json('regionsServed')->nullable();
            $table->json('specializations')->nullable();
            $table->enum('verificationStatus', ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'])->default('UNVERIFIED');
            // OrgVerificationStatus: UNVERIFIED, PENDING, VERIFIED, REJECTED
            $table->timestamp('verifiedAt')->nullable();
            $table->text('verificationNote')->nullable();
            $table->double('ratingAvg')->default(0);
            $table->integer('ratingCount')->default(0);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('OrganizationMember', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('organizationId');
            $table->text('userId');
            $table->enum('role', ['OWNER', 'MANAGER', 'EMPLOYEE'])->default('EMPLOYEE');
            // OrgMemberRole: OWNER, MANAGER, EMPLOYEE
            $table->text('position')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['organizationId', 'userId']);
        });
        Schema::create('Facility', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('ownerId');
            $table->text('title');
            $table->enum('type', ['HOUSE', 'APARTMENT', 'COMMERCIAL', 'OTHER'])->default('HOUSE');
            // FacilityType: HOUSE, APARTMENT, COMMERCIAL, OTHER
            $table->text('address');
            $table->text('region')->nullable();
            $table->double('area')->nullable();
            $table->integer('floorsCount')->nullable();
            $table->integer('buildYear')->nullable();
            $table->text('description')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('FacilityAccess', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->text('userId');
            $table->enum('role', ['OWNER', 'REPRESENTATIVE', 'VIEWER'])->default('VIEWER');
            // FacilityAccessRole: OWNER, REPRESENTATIVE, VIEWER
            $table->text('invitedById')->nullable();
            $table->timestamp('expiresAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['facilityId', 'userId']);
        });
        Schema::create('Building', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->text('name');
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Floor', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('buildingId');
            $table->integer('number');
            $table->text('name')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['buildingId', 'number']);
        });
        Schema::create('Zone', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('floorId');
            $table->text('name');
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('EngineeringSystem', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->enum('type', ['WATER', 'DRAINAGE', 'HEATING', 'AIR', 'ELECTRICITY', 'AUTOMATION', 'OTHER']);
            // SystemType: WATER, DRAINAGE, HEATING, AIR, ELECTRICITY, AUTOMATION, OTHER
            $table->text('name');
            $table->text('notes')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('Subsystem', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('systemId');
            $table->text('name');
            $table->text('notes')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Equipment', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->text('systemId')->nullable();
            $table->text('subsystemId')->nullable();
            $table->text('zoneId')->nullable();
            $table->text('name');
            $table->text('brand')->nullable();
            $table->text('model')->nullable();
            $table->text('serialNumber')->nullable();
            $table->timestamp('installedAt')->nullable();
            $table->timestamp('warrantyUntil')->nullable();
            $table->integer('serviceIntervalDays')->nullable();
            $table->timestamp('lastServiceAt')->nullable();
            $table->json('specs')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('EquipmentVersion', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('equipmentId');
            $table->integer('version');
            $table->json('data');
            $table->text('authorId')->nullable();
            $table->text('orderId')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['equipmentId', 'version']);
        });
        Schema::create('ServiceRecommendation', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->text('equipmentId')->nullable();
            $table->text('systemId')->nullable();
            $table->text('title');
            $table->text('reason')->nullable();
            $table->enum('severity', ['INFO', 'ADVISORY', 'IMPORTANT', 'CRITICAL'])->default('ADVISORY');
            // RecommendationSeverity: INFO, ADVISORY, IMPORTANT, CRITICAL
            $table->enum('status', ['ACTIVE', 'POSTPONED', 'DISMISSED', 'CONVERTED'])->default('ACTIVE');
            // RecommendationStatus: ACTIVE, POSTPONED, DISMISSED, CONVERTED
            $table->timestamp('dueAt')->nullable();
            $table->timestamp('lastServiceAt')->nullable();
            $table->text('createdByUserId')->nullable();
            $table->text('createdByOrgId')->nullable();
            $table->text('sourceOrderId')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('Request', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('customerId');
            $table->text('facilityId');
            $table->text('systemId')->nullable();
            $table->text('equipmentId')->nullable();
            $table->enum('type', ['PROFILE_FILL', 'DESIGN', 'INSTALLATION', 'RETROFIT', 'REPAIR', 'EMERGENCY', 'SERVICE_ONE_TIME', 'SERVICE_RECURRING', 'MATERIALS']);
            // RequestType: PROFILE_FILL, DESIGN, INSTALLATION, RETROFIT, REPAIR, EMERGENCY, SERVICE_ONE_TIME, SERVICE_RECURRING, MATERIALS
            $table->enum('status', ['DRAFT', 'MODERATION', 'PUBLISHED', 'HAS_OFFERS', 'CONTRACTOR_SELECTED', 'CONVERTED', 'EXPIRED', 'CANCELLED'])->default('DRAFT');
            // RequestStatus: DRAFT, MODERATION, PUBLISHED, HAS_OFFERS, CONTRACTOR_SELECTED, CONVERTED, EXPIRED, CANCELLED
            $table->text('title');
            $table->text('description')->nullable();
            $table->timestamp('desiredDateFrom')->nullable();
            $table->timestamp('desiredDateTo')->nullable();
            $table->text('visitTimeNote')->nullable();
            $table->integer('budgetMin')->nullable();
            $table->integer('budgetMax')->nullable();
            $table->enum('urgency', ['LOW', 'NORMAL', 'HIGH', 'EMERGENCY'])->default('NORMAL');
            // UrgencyLevel: LOW, NORMAL, HIGH, EMERGENCY
            $table->boolean('needsEstimate')->default(true);
            $table->boolean('needsContract')->default(true);
            $table->boolean('needsWarranty')->default(false);
            $table->text('contactName')->nullable();
            $table->text('contactPhone')->nullable();
            $table->text('moderationNote')->nullable();
            $table->timestamp('publishedAt')->nullable();
            $table->timestamp('expiresAt')->nullable();
            $table->timestamp('cancelledAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
            $table->text('acceptedOfferId')->nullable()->unique();
        });
        Schema::create('RequestAttachment', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('requestId');
            $table->text('fileName');
            $table->text('fileUrl');
            $table->integer('fileSize')->nullable();
            $table->text('mimeType')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Offer', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('requestId');
            $table->text('organizationId');
            $table->text('authorId');
            $table->enum('status', ['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'])->default('SENT');
            // OfferStatus: DRAFT, SENT, ACCEPTED, DECLINED, WITHDRAWN, EXPIRED
            $table->integer('priceTotal');
            $table->integer('priceMaterials')->nullable();
            $table->boolean('isEstimate')->default(false);
            $table->integer('durationDays')->nullable();
            $table->timestamp('validUntil')->nullable();
            $table->integer('warrantyMonths')->nullable();
            $table->json('paymentSchedule')->nullable();
            $table->json('stagesPlan')->nullable();
            $table->text('exclusions')->nullable();
            $table->text('comment')->nullable();
            $table->json('availableDates')->nullable();
            $table->integer('currentVersion')->default(1);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
            $table->unique(['requestId', 'organizationId']);
        });
        Schema::create('OfferVersion', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('offerId');
            $table->integer('version');
            $table->json('data');
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['offerId', 'version']);
        });
        Schema::create('Order', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('number')->unique();
            $table->text('requestId')->unique();
            $table->text('offerId')->unique();
            $table->text('customerId');
            $table->text('organizationId');
            $table->text('facilityId');
            $table->enum('status', ['AWAITING_CONTRACT', 'AWAITING_PREPAYMENT', 'PLANNING', 'IN_PROGRESS', 'PAUSED', 'AWAITING_ACCEPTANCE', 'REWORK', 'INSPECTION', 'DISPUTE', 'AWAITING_FINAL_PAYMENT', 'COMPLETED', 'CANCELLED'])->default('AWAITING_CONTRACT');
            // OrderStatus: AWAITING_CONTRACT, AWAITING_PREPAYMENT, PLANNING, IN_PROGRESS, PAUSED, AWAITING_ACCEPTANCE, REWORK, INSPECTION, DISPUTE, AWAITING_FINAL_PAYMENT, COMPLETED, CANCELLED
            $table->integer('priceTotal');
            $table->integer('prepaymentAmount')->nullable();
            $table->timestamp('scheduledStartAt')->nullable();
            $table->timestamp('scheduledEndAt')->nullable();
            $table->timestamp('startedAt')->nullable();
            $table->timestamp('completedAt')->nullable();
            $table->timestamp('cancelledAt')->nullable();
            $table->text('cancellationReason')->nullable();
            $table->boolean('addressRevealed')->default(false);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('OrderParticipant', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->text('userId');
            $table->text('roleNote')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['orderId', 'userId']);
        });
        Schema::create('OrderStage', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->integer('index');
            $table->text('name');
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'DONE', 'FAILED'])->default('PENDING');
            // StageStatus: PENDING, IN_PROGRESS, DONE, FAILED
            $table->timestamp('plannedAt')->nullable();
            $table->timestamp('startedAt')->nullable();
            $table->timestamp('completedAt')->nullable();
            $table->text('failReason')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
            $table->unique(['orderId', 'index']);
        });
        Schema::create('StageEvidence', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('stageId');
            $table->enum('type', ['PHOTO', 'VIDEO', 'FILE', 'NOTE']);
            // EvidenceType: PHOTO, VIDEO, FILE, NOTE
            $table->text('fileUrl')->nullable();
            $table->text('note')->nullable();
            $table->text('createdById');
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('ChatThread', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->enum('kind', ['REQUEST', 'OFFER', 'ORDER', 'SUPPORT']);
            // ThreadKind: REQUEST, OFFER, ORDER, SUPPORT
            $table->text('requestId')->nullable();
            $table->text('offerId')->nullable();
            $table->text('orderId')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Message', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('threadId');
            $table->text('authorId');
            $table->text('body');
            $table->json('attachments')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Document', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->enum('category', ['EQUIPMENT_PASSPORT', 'SCHEME', 'CONTRACT', 'ESTIMATE', 'ACT', 'CERTIFICATE', 'WARRANTY', 'PHOTO', 'REPORT', 'OTHER'])->default('OTHER');
            // DocumentCategory: EQUIPMENT_PASSPORT, SCHEME, CONTRACT, ESTIMATE, ACT, CERTIFICATE, WARRANTY, PHOTO, REPORT, OTHER
            $table->text('title');
            $table->text('facilityId')->nullable();
            $table->text('equipmentId')->nullable();
            $table->text('requestId')->nullable();
            $table->text('orderId')->nullable();
            $table->text('organizationId')->nullable();
            $table->integer('currentVersion')->default(1);
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('DocumentVersion', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('documentId');
            $table->integer('version');
            $table->text('fileUrl');
            $table->text('fileName');
            $table->integer('fileSize')->nullable();
            $table->text('mimeType')->nullable();
            $table->text('uploadedById');
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['documentId', 'version']);
        });
        Schema::create('Contract', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId')->unique();
            $table->text('documentId')->nullable()->unique();
            $table->json('terms')->nullable();
            $table->timestamp('signedByCustomerAt')->nullable();
            $table->timestamp('signedByContractorAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Payment', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->enum('kind', ['PREPAYMENT', 'FINAL', 'ADDITIONAL']);
            // PaymentKind: PREPAYMENT, FINAL, ADDITIONAL
            $table->enum('status', ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'])->default('PENDING');
            // PaymentStatus: PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED, REFUNDED
            $table->integer('amount');
            $table->text('currency')->default('RUB');
            $table->text('externalId')->nullable()->unique();
            $table->text('idempotencyKey')->nullable()->unique();
            $table->timestamp('paidAt')->nullable();
            $table->text('failReason')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('Refund', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('paymentId');
            $table->integer('amount');
            $table->enum('status', ['PENDING', 'SUCCEEDED', 'FAILED'])->default('PENDING');
            // RefundStatus: PENDING, SUCCEEDED, FAILED
            $table->text('reason')->nullable();
            $table->text('externalId')->nullable()->unique();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Inspection', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->enum('status', ['REQUESTED', 'IN_PROGRESS', 'PASSED', 'ISSUES_FOUND', 'CANCELLED'])->default('REQUESTED');
            // InspectionStatus: REQUESTED, IN_PROGRESS, PASSED, ISSUES_FOUND, CANCELLED
            $table->text('requestedById');
            $table->text('inspectorName')->nullable();
            $table->timestamp('scheduledAt')->nullable();
            $table->text('conclusion')->nullable();
            $table->text('reportDocumentId')->nullable()->unique();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('Dispute', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->enum('status', ['OPEN', 'UNDER_REVIEW', 'RESOLVED_CUSTOMER', 'RESOLVED_CONTRACTOR', 'RESOLVED_COMPROMISE', 'CLOSED'])->default('OPEN');
            // DisputeStatus: OPEN, UNDER_REVIEW, RESOLVED_CUSTOMER, RESOLVED_CONTRACTOR, RESOLVED_COMPROMISE, CLOSED
            $table->text('openedById');
            $table->text('subject');
            $table->text('description')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamp('resolvedAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->timestamp('updatedAt');
        });
        Schema::create('ProfileChangeProposal', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('facilityId');
            $table->text('equipmentId')->nullable();
            $table->text('orderId')->nullable();
            $table->text('authorId');
            $table->text('authorOrgId')->nullable();
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION'])->default('PENDING');
            // ProposalStatus: PENDING, APPROVED, REJECTED, CLARIFICATION
            $table->json('changes');
            $table->text('comment')->nullable();
            $table->text('decisionComment')->nullable();
            $table->text('decidedById')->nullable();
            $table->timestamp('decidedAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('Review', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('orderId');
            $table->enum('direction', ['CUSTOMER_TO_CONTRACTOR', 'CONTRACTOR_TO_CUSTOMER']);
            // ReviewDirection: CUSTOMER_TO_CONTRACTOR, CONTRACTOR_TO_CUSTOMER
            $table->text('authorId');
            $table->text('targetUserId')->nullable();
            $table->text('targetOrgId')->nullable();
            $table->integer('rating');
            $table->text('text')->nullable();
            $table->timestamp('createdAt')->useCurrent();
            $table->unique(['orderId', 'direction']);
        });
        Schema::create('Notification', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('userId');
            $table->enum('kind', ['SYSTEM', 'REQUEST', 'OFFER', 'ORDER', 'PAYMENT', 'CHAT', 'RECOMMENDATION'])->default('SYSTEM');
            // NotificationKind: SYSTEM, REQUEST, OFFER, ORDER, PAYMENT, CHAT, RECOMMENDATION
            $table->text('title');
            $table->text('body')->nullable();
            $table->text('href')->nullable();
            $table->timestamp('readAt')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::create('AuditEvent', function (Blueprint $table) {
            $table->text('id')->primary();
            $table->text('actorId')->nullable();
            $table->text('action');
            $table->text('entity');
            $table->text('entityId');
            $table->json('meta')->nullable();
            $table->timestamp('createdAt')->useCurrent();
        });
        Schema::table('Account', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->cascadeOnDelete();
        });
        Schema::table('Session', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->cascadeOnDelete();
        });
        Schema::table('OrganizationMember', function (Blueprint $table) {
            $table->foreign('organizationId')->references('id')->on('Organization')->cascadeOnDelete();
        });
        Schema::table('OrganizationMember', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->cascadeOnDelete();
        });
        Schema::table('Facility', function (Blueprint $table) {
            $table->foreign('ownerId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('FacilityAccess', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->cascadeOnDelete();
        });
        Schema::table('FacilityAccess', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->cascadeOnDelete();
        });
        Schema::table('Building', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->cascadeOnDelete();
        });
        Schema::table('Floor', function (Blueprint $table) {
            $table->foreign('buildingId')->references('id')->on('Building')->cascadeOnDelete();
        });
        Schema::table('Zone', function (Blueprint $table) {
            $table->foreign('floorId')->references('id')->on('Floor')->cascadeOnDelete();
        });
        Schema::table('EngineeringSystem', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->cascadeOnDelete();
        });
        Schema::table('Subsystem', function (Blueprint $table) {
            $table->foreign('systemId')->references('id')->on('EngineeringSystem')->cascadeOnDelete();
        });
        Schema::table('Equipment', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->cascadeOnDelete();
        });
        Schema::table('Equipment', function (Blueprint $table) {
            $table->foreign('systemId')->references('id')->on('EngineeringSystem')->restrictOnDelete();
        });
        Schema::table('Equipment', function (Blueprint $table) {
            $table->foreign('subsystemId')->references('id')->on('Subsystem')->restrictOnDelete();
        });
        Schema::table('Equipment', function (Blueprint $table) {
            $table->foreign('zoneId')->references('id')->on('Zone')->restrictOnDelete();
        });
        Schema::table('EquipmentVersion', function (Blueprint $table) {
            $table->foreign('equipmentId')->references('id')->on('Equipment')->cascadeOnDelete();
        });
        Schema::table('EquipmentVersion', function (Blueprint $table) {
            $table->foreign('authorId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('EquipmentVersion', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->cascadeOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('equipmentId')->references('id')->on('Equipment')->restrictOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('systemId')->references('id')->on('EngineeringSystem')->restrictOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('createdByUserId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('createdByOrgId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('ServiceRecommendation', function (Blueprint $table) {
            $table->foreign('sourceOrderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Request', function (Blueprint $table) {
            $table->foreign('customerId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Request', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->restrictOnDelete();
        });
        Schema::table('Request', function (Blueprint $table) {
            $table->foreign('systemId')->references('id')->on('EngineeringSystem')->restrictOnDelete();
        });
        Schema::table('Request', function (Blueprint $table) {
            $table->foreign('equipmentId')->references('id')->on('Equipment')->restrictOnDelete();
        });
        Schema::table('Request', function (Blueprint $table) {
            $table->foreign('acceptedOfferId')->references('id')->on('Offer')->restrictOnDelete();
        });
        Schema::table('RequestAttachment', function (Blueprint $table) {
            $table->foreign('requestId')->references('id')->on('Request')->cascadeOnDelete();
        });
        Schema::table('Offer', function (Blueprint $table) {
            $table->foreign('requestId')->references('id')->on('Request')->cascadeOnDelete();
        });
        Schema::table('Offer', function (Blueprint $table) {
            $table->foreign('organizationId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('Offer', function (Blueprint $table) {
            $table->foreign('authorId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('OfferVersion', function (Blueprint $table) {
            $table->foreign('offerId')->references('id')->on('Offer')->cascadeOnDelete();
        });
        Schema::table('Order', function (Blueprint $table) {
            $table->foreign('requestId')->references('id')->on('Request')->restrictOnDelete();
        });
        Schema::table('Order', function (Blueprint $table) {
            $table->foreign('offerId')->references('id')->on('Offer')->restrictOnDelete();
        });
        Schema::table('Order', function (Blueprint $table) {
            $table->foreign('organizationId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('Order', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->restrictOnDelete();
        });
        Schema::table('OrderParticipant', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->cascadeOnDelete();
        });
        Schema::table('OrderParticipant', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('OrderStage', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->cascadeOnDelete();
        });
        Schema::table('StageEvidence', function (Blueprint $table) {
            $table->foreign('stageId')->references('id')->on('OrderStage')->cascadeOnDelete();
        });
        Schema::table('StageEvidence', function (Blueprint $table) {
            $table->foreign('createdById')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('ChatThread', function (Blueprint $table) {
            $table->foreign('requestId')->references('id')->on('Request')->restrictOnDelete();
        });
        Schema::table('ChatThread', function (Blueprint $table) {
            $table->foreign('offerId')->references('id')->on('Offer')->restrictOnDelete();
        });
        Schema::table('ChatThread', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Message', function (Blueprint $table) {
            $table->foreign('threadId')->references('id')->on('ChatThread')->cascadeOnDelete();
        });
        Schema::table('Message', function (Blueprint $table) {
            $table->foreign('authorId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Document', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->restrictOnDelete();
        });
        Schema::table('Document', function (Blueprint $table) {
            $table->foreign('equipmentId')->references('id')->on('Equipment')->restrictOnDelete();
        });
        Schema::table('Document', function (Blueprint $table) {
            $table->foreign('requestId')->references('id')->on('Request')->restrictOnDelete();
        });
        Schema::table('Document', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Document', function (Blueprint $table) {
            $table->foreign('organizationId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('DocumentVersion', function (Blueprint $table) {
            $table->foreign('documentId')->references('id')->on('Document')->cascadeOnDelete();
        });
        Schema::table('DocumentVersion', function (Blueprint $table) {
            $table->foreign('uploadedById')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Contract', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->cascadeOnDelete();
        });
        Schema::table('Contract', function (Blueprint $table) {
            $table->foreign('documentId')->references('id')->on('Document')->restrictOnDelete();
        });
        Schema::table('Payment', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Refund', function (Blueprint $table) {
            $table->foreign('paymentId')->references('id')->on('Payment')->restrictOnDelete();
        });
        Schema::table('Inspection', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Inspection', function (Blueprint $table) {
            $table->foreign('requestedById')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Inspection', function (Blueprint $table) {
            $table->foreign('reportDocumentId')->references('id')->on('Document')->restrictOnDelete();
        });
        Schema::table('Dispute', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Dispute', function (Blueprint $table) {
            $table->foreign('openedById')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('facilityId')->references('id')->on('Facility')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('equipmentId')->references('id')->on('Equipment')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('authorId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('authorOrgId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('ProfileChangeProposal', function (Blueprint $table) {
            $table->foreign('decidedById')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Review', function (Blueprint $table) {
            $table->foreign('orderId')->references('id')->on('Order')->restrictOnDelete();
        });
        Schema::table('Review', function (Blueprint $table) {
            $table->foreign('authorId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Review', function (Blueprint $table) {
            $table->foreign('targetUserId')->references('id')->on('User')->restrictOnDelete();
        });
        Schema::table('Review', function (Blueprint $table) {
            $table->foreign('targetOrgId')->references('id')->on('Organization')->restrictOnDelete();
        });
        Schema::table('Notification', function (Blueprint $table) {
            $table->foreign('userId')->references('id')->on('User')->cascadeOnDelete();
        });
        Schema::table('AuditEvent', function (Blueprint $table) {
            $table->foreign('actorId')->references('id')->on('User')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('AuditEvent');
        Schema::dropIfExists('Notification');
        Schema::dropIfExists('Review');
        Schema::dropIfExists('ProfileChangeProposal');
        Schema::dropIfExists('Dispute');
        Schema::dropIfExists('Inspection');
        Schema::dropIfExists('Refund');
        Schema::dropIfExists('Payment');
        Schema::dropIfExists('Contract');
        Schema::dropIfExists('DocumentVersion');
        Schema::dropIfExists('Document');
        Schema::dropIfExists('Message');
        Schema::dropIfExists('ChatThread');
        Schema::dropIfExists('StageEvidence');
        Schema::dropIfExists('OrderStage');
        Schema::dropIfExists('OrderParticipant');
        Schema::dropIfExists('Order');
        Schema::dropIfExists('OfferVersion');
        Schema::dropIfExists('Offer');
        Schema::dropIfExists('RequestAttachment');
        Schema::dropIfExists('Request');
        Schema::dropIfExists('ServiceRecommendation');
        Schema::dropIfExists('EquipmentVersion');
        Schema::dropIfExists('Equipment');
        Schema::dropIfExists('Subsystem');
        Schema::dropIfExists('EngineeringSystem');
        Schema::dropIfExists('Zone');
        Schema::dropIfExists('Floor');
        Schema::dropIfExists('Building');
        Schema::dropIfExists('FacilityAccess');
        Schema::dropIfExists('Facility');
        Schema::dropIfExists('OrganizationMember');
        Schema::dropIfExists('Organization');
        Schema::dropIfExists('VerificationToken');
        Schema::dropIfExists('Session');
        Schema::dropIfExists('Account');
        Schema::dropIfExists('User');
        Schema::enableForeignKeyConstraints();
    }
};
