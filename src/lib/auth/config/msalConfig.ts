import { type Configuration, LogLevel } from '@azure/msal-browser';

export interface AzureADMember {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
}

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    // storeAuthStateInCookie: false
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error(message);
      },
      logLevel: LogLevel.Warning
    }
  }
};

export const loginRequest = {
  scopes: ['User.Read', 'User.Read.All', 'GroupMember.Read.All']
};

export const graphConfig = {
  // Filter by account enabled (active users only)
  graphMembersEndpoint:
    "https://graph.microsoft.com/v1.0/users?" +
    "$filter=userType eq 'Member' and accountEnabled eq true" +
    "&$select=id,displayName,mail,userPrincipalName,jobTitle,department" +
    "&$top=100",
    graphGroupMembersEndpoint:
    `https://graph.microsoft.com/v1.0/groups/6d426ec3-9834-476d-9150-c51d4b4d1a8a/members?$select=id,displayName,mail`
};