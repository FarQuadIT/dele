import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileSettingsForm } from "@/components/cabinet/profile-settings-form";


export default function SettingsPage({ user }: { user: {name:string;email:string;phone:string|null} }) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 md:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Настройки</h1>
      <p className="text-sm text-muted-foreground">
        Личные данные аккаунта. Данные компании — в разделе «Компания».
      </p>

      <Card className="mt-6 shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Личные данные</CardTitle>
          <CardDescription>
            Имя видно заказчикам в откликах и чатах.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            defaults={{
              name: user?.name ?? "",
              phone: user?.phone ?? "",
              email: user?.email ?? "",
            }}
          />
        </CardContent>
      </Card>
    </main>
  );
}
