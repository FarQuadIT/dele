"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FacilityFull } from "./types";
import { FacilityOverview } from "./facility-overview";
import { ProfileTree } from "./profile-tree";
import { FacilityDocuments } from "./facility-documents";
import { FacilityRecommendations } from "./facility-recommendations";
import { ProfileProposals } from "./profile-proposals";

const TAB_IDS = [
  "overview",
  "profile",
  "documents",
  "recommendations",
  "proposals",
] as const;
type TabId = (typeof TAB_IDS)[number];

export function FacilityTabs({
  facility,
  defaultTab,
  initialEquipmentId,
}: {
  facility: FacilityFull;
  defaultTab?: string;
  initialEquipmentId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<TabId>(
    TAB_IDS.includes(defaultTab as TabId) ? (defaultTab as TabId) : "overview",
  );

  const activeRecommendations = facility.recommendations.filter(
    (r) => r.status === "ACTIVE",
  );
  const pendingProposals = facility.proposals.filter(
    (p) => p.status === "PENDING",
  );

  const changeTab = useCallback(
    (value: string) => {
      setTab(value as TabId);
      const params = new URLSearchParams();
      if (value !== "overview") params.set("tab", value);
      router.replace(
        params.size > 0 ? `${pathname}?${params}` : pathname,
        { scroll: false },
      );
    },
    [pathname, router],
  );

  const openEquipment = useCallback(
    (equipmentId: string) => {
      setTab("profile");
      router.replace(`${pathname}?tab=profile&eq=${equipmentId}`, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  return (
    <Tabs value={tab} onValueChange={changeTab} className="mt-6">
      <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
        <TabsTrigger value="overview">Обзор</TabsTrigger>
        <TabsTrigger value="profile">Цифровой профиль</TabsTrigger>
        <TabsTrigger value="documents">
          Документы
          <span className="ml-1.5 rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
            {facility.documents.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="recommendations">
          Рекомендации
          {activeRecommendations.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] tabular-nums text-primary-foreground">
              {activeRecommendations.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="proposals">
          Изменения
          {pendingProposals.length > 0 && (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[11px] tabular-nums text-primary-foreground">
              {pendingProposals.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <FacilityOverview facility={facility} onOpenEquipment={openEquipment} />
      </TabsContent>
      <TabsContent value="profile" className="mt-6">
        <ProfileTree
          facility={facility}
          initialEquipmentId={initialEquipmentId}
        />
      </TabsContent>
      <TabsContent value="documents" className="mt-6">
        <FacilityDocuments documents={facility.documents} />
      </TabsContent>
      <TabsContent value="recommendations" className="mt-6">
        <FacilityRecommendations
          facilityId={facility.id}
          items={facility.recommendations}
          onOpenEquipment={openEquipment}
        />
      </TabsContent>
      <TabsContent value="proposals" className="mt-6">
        <ProfileProposals items={facility.proposals} />
      </TabsContent>
    </Tabs>
  );
}
