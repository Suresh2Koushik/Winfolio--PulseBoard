import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { importFromExcel } from "@/utils/importData";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ImportStage = "idle" | "parsing" | "validating" | "importing" | "complete";

export function UploadModal({ open, onOpenChange, onImportComplete }: UploadModalProps) {
  const { user } = useAuth();
  const { categories, teams } = useUserData();
  const [stage, setStage] = useState<ImportStage>("idle");
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Reset state
    setStage("parsing");
    setProgress(20);
    setSuccessCount(0);
    setErrors([]);
    setDuplicates(0);
    setShowErrors(false);

    try {
      // Simulate parsing stage
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStage("validating");
      setProgress(40);

      // Simulate validation stage
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStage("importing");
      setProgress(60);

      // Perform actual import
      const categoryNames = categories.map((c) => c.name);
      const result = await importFromExcel(file, user.uid, categoryNames, teams);

      setProgress(100);
      setStage("complete");
      setSuccessCount(result.success);
      setErrors(result.errors);
      setDuplicates(result.duplicates);

      // Refresh activities list
      onImportComplete();
    } catch (error: any) {
      setStage("complete");
      setErrors([`Failed to import: ${error.message || "Unknown error"}`]);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setStage("idle");
    setProgress(0);
    setSuccessCount(0);
    setErrors([]);
    setDuplicates(0);
    setShowErrors(false);
    onOpenChange(false);
  };

  const getStageLabel = () => {
    switch (stage) {
      case "parsing":
        return "Parsing Excel file...";
      case "validating":
        return "Validating data...";
      case "importing":
        return "Importing activities...";
      case "complete":
        return "Import complete!";
      default:
        return "Select an Excel file to import";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Activities from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {stage === "idle" && (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload an Excel file (.xlsx, .xls) with your activities
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Select Excel File
                  </span>
                </Button>
              </label>
            </div>
          )}

          {(stage === "parsing" || stage === "validating" || stage === "importing") && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="font-medium">{getStageLabel()}</p>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {stage === "complete" && (
            <div className="space-y-4">
              {successCount > 0 && (
                <Alert className="bg-primary/10 border-primary">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary font-medium">
                    ✅ {successCount} activities imported successfully!
                  </AlertDescription>
                </Alert>
              )}

              {duplicates > 0 && (
                <Alert className="bg-amber-500/10 border-amber-500">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-600">
                    ⚠️ {duplicates} duplicate activities were skipped
                  </AlertDescription>
                </Alert>
              )}

              {errors.length > 0 && (
                <div className="space-y-2">
                  <Alert className="bg-destructive/10 border-destructive">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive font-medium">
                      ⚠️ {errors.length} rows had errors and were not imported
                    </AlertDescription>
                  </Alert>

                  {errors.length <= 5 ? (
                    <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
                      <ul className="text-xs space-y-1">
                        {errors.map((error, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowErrors(!showErrors)}
                        className="mb-2"
                      >
                        {showErrors ? "Hide" : "Show"} Error Details
                      </Button>
                      {showErrors && (
                        <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
                          <ul className="text-xs space-y-1">
                            {errors.map((error, idx) => (
                              <li key={idx} className="text-muted-foreground">
                                • {error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStage("idle");
                    setProgress(0);
                  }}
                  className="flex-1"
                >
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
