import { Link as RouterLink, type LinkProps as RouterLinkProps} from "react-router";

export const Link = ({ to, children}: RouterLinkProps) => {

    return (
        <RouterLink to={to} className="text-blue-500 hover:underline">
            {children}
        </RouterLink>
    )
}