import { useNavigate } from "react-router";
import { Button } from "../base";
import { BackupPanel } from "../backup";
import { TransferPanel } from "../transfer";
import { useAuth } from "../providers/authProvider";
import { ROUTES } from "~/consts/routes";

export function Account() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <main className="flex flex-col items-start justify-center gap-6 p-8 max-w-3xl mx-auto">

    <div className="flex w-full">
      <Button onClick={()=> navigate(ROUTES.home)} > Home 🏠</Button>
    </div>

    <h1 className="text-2xl font-bold sm:text-3xl">Account</h1>

    {auth.status === "authenticated" && auth.user && (
      <div className="flex w-full flex-col gap-6">
        <div>
          <p>Name: {auth.user.name}</p>
          <p>Email: {auth.user.email}</p>
        </div>

        <BackupPanel email={auth.user.email} />

        <TransferPanel />

        {/* TODO: session history, data deletion */}
      </div>
    )}

    </main>
  );
}
