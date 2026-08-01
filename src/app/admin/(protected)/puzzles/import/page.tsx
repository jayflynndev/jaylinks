import { BulkImportForm } from "@/components/admin/BulkImportForm";

export const dynamic = "force-dynamic";

export default function BulkImportPage() {
  return (
    <div>
      <h2 className="mb-2 font-display text-2xl text-yellow-300">Bulk import</h2>
      <p className="mb-6 font-sans text-sm text-yellow-100/70">
        Paste JSON for one or more puzzles, preview warnings, then confirm to import. See{" "}
        <code>docs/ADDING_PUZZLES.md</code> for the schema.
      </p>
      <BulkImportForm />
    </div>
  );
}
