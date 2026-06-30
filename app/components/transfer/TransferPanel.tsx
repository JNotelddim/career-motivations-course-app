import { ExportCard } from "./ExportCard";
import { ImportCard } from "./ImportCard";

/** Import + export of answers as plain JSON, grouped for the account page. The
 *  local-only counterpart to the encrypted backup: no server, no password. */
export const TransferPanel: React.FC = () => (
  <div className="flex w-full flex-col gap-4">
    <ExportCard />
    <ImportCard />
  </div>
);
