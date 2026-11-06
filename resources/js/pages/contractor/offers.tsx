import type {Request as ServiceRequest,Offer,Organization} from '@/types/models';
import { OffersList } from "@/components/contractor/offers-list";


export default function ContractorOffersPage({offers,user}:{offers:Offer[];user:{id:string}}) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Мои отклики</h1>
      <p className="text-sm text-muted-foreground">
        Принятый отклик становится основой договора и не редактируется.
      </p>

      <OffersList
        currentUserId={user.id}
        offers={offers.map((o) => ({
          id: o.id,
          status: o.status,
          priceTotal: o.priceTotal,
          durationDays: o.durationDays,
          warrantyMonths: o.warrantyMonths,
          comment: o.comment,
          createdAt: o.createdAt,
          request: {
            id: o.request.id,
            title: o.request.title,
            type: o.request.type,
            orderId: o.request.order?.id ?? null,
          },
          messages: (o.threads[0]?.messages ?? []).map((m) => ({
            id: m.id,
            body: m.body,
            createdAt: m.createdAt,
            authorId: m.author.id,
            authorName: m.author.name ?? "Пользователь",
          })),
        }))}
      />
    </main>
  );
}
