import { useEffect } from "react";
import type { Route } from "./+types/unauthenticated";
import { Unauthenticated } from "~/components/page/unauthenticated";
import { useAuth } from "~/components/providers/authProvider";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Career Worksheet - Unable to sign in" },
    { name: "description", content: "" },
  ];
}

export default function UnauthenticatedRoute() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect( () => {
    if(status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [status])

  return <Unauthenticated />;
}
