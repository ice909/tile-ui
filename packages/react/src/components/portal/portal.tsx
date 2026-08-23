import React, { createContext, useContext, useEffect, useState } from 'react';

export type PortalContainer = Element | null;

const PortalContainerContext = createContext<PortalContainer>(null);

export interface PortalProviderProps {
	container?: PortalContainer;
	children?: React.ReactNode;
}

function PortalProvider({ container = null, children }: PortalProviderProps) {
	const parentContainer = useContext(PortalContainerContext);

	return <PortalContainerContext.Provider value={container ?? parentContainer}>{children}</PortalContainerContext.Provider>;
}

PortalProvider.displayName = 'PortalProvider';

function usePortalContainer(container?: PortalContainer): PortalContainer {
	const contextContainer = useContext(PortalContainerContext);
	const [defaultContainer, setDefaultContainer] = useState<PortalContainer>(null);

	useEffect(() => {
		setDefaultContainer(document.body);
	}, []);

	return container ?? contextContainer ?? defaultContainer;
}

export { PortalProvider, usePortalContainer };
