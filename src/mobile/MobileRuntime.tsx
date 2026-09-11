import { useEffect, useState, type PropsWithChildren } from "react";
import { MobileDeviceProvider, useMobileDevice } from "./Device";
import { KeyboardDock, KeyboardProvider, useKeyboard } from "./Keyboard";
import { PhoneFrame } from "./PhoneFrame";
import { HomeIndicator, StatusBar } from "./components";

export function MobileRuntime({ children }: PropsWithChildren) {
  return <MobileDeviceProvider><ResponsiveMobileRuntime>{children}</ResponsiveMobileRuntime></MobileDeviceProvider>;
}

function ResponsiveMobileRuntime({ children }: PropsWithChildren) {
  const fullScreen = useCompactViewport();

  return <PhoneFrame fullScreen={fullScreen}><KeyboardProvider simulationEnabled={!fullScreen}><KeyboardPreview enabled={!fullScreen} />{fullScreen ? null : <StatusBar />}<MobileAppViewport fullScreen={fullScreen}>{children}</MobileAppViewport>{fullScreen ? null : <HomeIndicator />}{fullScreen ? null : <KeyboardDock />}</KeyboardProvider></PhoneFrame>;
}

function useCompactViewport() {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 600px)");
    const update = () => setCompact(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return compact;
}

function MobileAppViewport({ children, fullScreen }: PropsWithChildren<{ fullScreen: boolean }>) {
  const { device } = useMobileDevice();
  const keyboard = useKeyboard();

  return (
    <div
      className="mobile-app-viewport"
      data-keyboard-visible={keyboard.visible ? "true" : "false"}
      data-platform={device.platform}
      data-full-screen={fullScreen ? "true" : "false"}
      data-testid="mobile-app-viewport"
    >
      {children}
    </div>
  );
}

function KeyboardPreview({ enabled }: { enabled: boolean }) {
  const keyboard = useKeyboard();

  useEffect(() => {
    if (!enabled) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("keyboard") === "1") {
      keyboard.show();
    }
  }, [enabled, keyboard]);

  return null;
}
