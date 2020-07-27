import { IMsalProps } from "./MsalContext";

type FaaCFunction = (props: IMsalProps) => React.ReactNode;

export function getChildrenOrFunction(children: React.ReactNode | FaaCFunction, props: IMsalProps): React.ReactNode {
    if (typeof children === 'function') {
        return children(props);
    }
    return children;
}