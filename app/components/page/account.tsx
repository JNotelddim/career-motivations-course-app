import { useNavigate } from "react-router";
import { Button } from "../base";
import { useAuth } from "../providers/authProvider";
import { ROUTES } from "~/consts/routes";

export function Account() {
  const navigate = useNavigate();
  const auth = useAuth();

  return (
    <main className="flex flex-col items-start justify-center gap-4 p-8 max-w-3xl mx-auto">

    <div className="flex w-full">
      <Button onClick={()=> navigate(ROUTES.home)} > Home 🏠</Button>
    </div>

    <h1 className="text-2xl font-bold sm:text-3xl">Account</h1>

    {auth.status === "authenticated" && auth.user && (
      <div>
        <p>Name: {auth.user.name}</p>
        <p>Email: {auth.user.email}</p>
      
        <p>TODO: session history, CTAs for: data deletion, data backup, data download</p>
      </div>
    )}

    </main>
  );
}
