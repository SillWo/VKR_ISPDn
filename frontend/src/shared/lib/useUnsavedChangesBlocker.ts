import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";

type UseUnsavedChangesBlockerParams = {
  when: boolean;
  onSave: () => Promise<void> | void;
  onDiscard?: () => void;
};

export function useUnsavedChangesBlocker({ when, onSave, onDiscard }: UseUnsavedChangesBlockerParams) {
  const [isSaving, setIsSaving] = useState(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return when && currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (!when) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [when]);

  const cancelNavigation = () => {
    blocker.reset?.();
  };

  const discardAndProceed = () => {
    onDiscard?.();
    blocker.proceed?.();
  };

  const saveAndProceed = async () => {
    setIsSaving(true);
    try {
      await onSave();
      blocker.proceed?.();
    } catch {
      blocker.reset?.();
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isDialogOpen: blocker.state === "blocked",
    isSaving,
    cancelNavigation,
    discardAndProceed,
    saveAndProceed,
  };
}
