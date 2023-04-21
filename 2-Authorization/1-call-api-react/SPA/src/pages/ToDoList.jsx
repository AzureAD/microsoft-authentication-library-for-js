import { useEffect, useState } from 'react';
import { MsalAuthenticationTemplate } from '@azure/msal-react';
import { InteractionType } from '@azure/msal-browser';

import { ListView } from '../components/ListView';
import { loginRequest, protectedResources } from "../authConfig";
import useFetchWithMsal from '../hooks/useFetchWithMsal';

const ToDoListContent = () => {
    const { error, execute } = useFetchWithMsal({
        scopes: protectedResources.toDoListAPI.scopes.read,
    });

    const [toDoListData, setToDoListData] = useState(null);

    useEffect(() => {
        if (!toDoListData) {
            execute("GET", protectedResources.toDoListAPI.endpoint).then((response) => {
                setToDoListData(response);
            });
        }
    }, [execute, toDoListData])

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return <>{toDoListData ? <ListView toDoListData={toDoListData} /> : null}</>;
};

/**
 * The `MsalAuthenticationTemplate` component will render its children if a user is authenticated
 * or attempt to sign a user in. Just provide it with the interaction type you would like to use
 * (redirect or popup) and optionally a request object to be passed to the login API, a component to display while
 * authentication is in progress or a component to display if an error occurs. For more, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
 */
export const ToDoList = () => {
    const authRequest = {
        ...loginRequest,
    };

    return (
        <MsalAuthenticationTemplate 
            interactionType={InteractionType.Redirect} 
            authenticationRequest={authRequest}
        >
            <ToDoListContent />
        </MsalAuthenticationTemplate>
    );
};
