import { BackupCard } from "./BackupCard";
import { RestoreCard } from "./RestoreCard";

/** Backup + restore, grouped for the account page. Requires the signed-in
 *  viewer's email — the backup document is keyed by it. */
export const BackupPanel: React.FC<{ email: string }> = ({ email }) => (
  <div className="flex w-full flex-col gap-4">
    <BackupCard email={email} />
    <RestoreCard email={email} />
  </div>
);
