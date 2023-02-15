/**
 * Populate claims table with appropriate description
 * @param {Record} claims ID token claims
 * @returns claimsTable
 */
export const createClaimsTable = (claims: Record<string, string>): any[] => {
  const claimsTable: any[] = [];

  Object.keys(claims).map((key) => {
    switch (key) {
      case 'aud':
        populateClaim(
          key,
          claims[key],
          "Identifies the intended recipient of the token. In ID tokens, the audience is your app's Application ID, assigned to your app in the Azure portal.",
          claimsTable
        );
        break;
      case 'iss':
        populateClaim(
          key,
          claims[key],
          'Identifies the issuer, or authorization server that constructs and returns the token. It also identifies the Azure AD tenant for which the user was authenticated. If the token was issued by the v2.0 endpoint, the URI will end in /v2.0.',
          claimsTable
        );
        break;
      case 'iat':
        populateClaim(
          key,
          changeDateFormat(+claims[key]),
          '"Issued At" indicates the timestamp (UNIX timestamp) when the authentication for this user occurred.',
          claimsTable
        );
        break;
      case 'nbf':
        populateClaim(
          key,
          changeDateFormat(+claims[key]),
          'The nbf (not before) claim dictates the time (as UNIX timestamp) before which the JWT must not be accepted for processing.',
          claimsTable
        );
        break;
      case 'exp':
        populateClaim(
          key,
          changeDateFormat(+claims[key]),
          "The exp (expiration time) claim dictates the expiration time (as UNIX timestamp) on or after which the JWT must not be accepted for processing. It's important to note that in certain circumstances, a resource may reject the token before this time. For example, if a change in authentication is required or a token revocation has been detected.",
          claimsTable
        );
        break;
      case 'name':
        populateClaim(
          key,
          claims[key],
          "The name claim provides a human-readable value that identifies the subject of the token. The value isn't guaranteed to be unique, it can be changed, and it's designed to be used only for display purposes. The 'profile' scope is required to receive this claim.",
          claimsTable
        );
        break;
      case 'preferred_username':
        populateClaim(
          key,
          claims[key],
          'The primary username that represents the user. It could be an email address, phone number, or a generic username without a specified format. Its value is mutable and might change over time. Since it is mutable, this value must not be used to make authorization decisions. It can be used for username hints, however, and in human-readable UI as a username. The profile scope is required in order to receive this claim.',
          claimsTable
        );
        break;
      case 'nonce':
        populateClaim(
          key,
          claims[key],
          'The nonce matches the parameter included in the original /authorize request to the IDP.',
          claimsTable
        );
        break;
      case 'oid':
        populateClaim(
          key,
          claims[key],
          'The oid (user object id) is the only claim that should be used to uniquely identify a user in an Azure AD tenant.',
          claimsTable
        );
        break;
      case 'tid':
        populateClaim(
          key,
          claims[key],
          'The id of the tenant where this application resides. You can use this claim to ensure that only users from the current Azure AD tenant can access this app.',
          claimsTable
        );
        break;
      case 'upn':
        populateClaim(
          key,
          claims[key],
          'upn (user principal name) might be unique amongst the active set of users in a tenant but tend to get reassigned to new employees as employees leave the organization and others take their place or might change to reflect a personal change like marriage.',
          claimsTable
        );
        break;
      case 'email':
        populateClaim(
          key,
          claims[key],
          'Email might be unique amongst the active set of users in a tenant but tend to get reassigned to new employees as employees leave the organization and others take their place.',
          claimsTable
        );
        break;
      case 'acct':
        populateClaim(
          key,
          claims[key],
          'Available as an optional claim, it lets you know what the type of user (homed, guest) is. For example, for an individual’s access to their data you might not care for this claim, but you would use this along with tenant id (tid) to control access to say a company-wide dashboard to just employees (homed users) and not contractors (guest users).',
          claimsTable
        );
        break;
      case 'sid':
        populateClaim(
          key,
          claims[key],
          'Session ID, used for per-session user sign-out.',
          claimsTable
        );
        break;
      case 'sub':
        populateClaim(
          key,
          claims[key],
          'The sub claim is a pairwise identifier - it is unique to a particular application ID. If a single user signs into two different apps using two different client IDs, those apps will receive two different values for the subject claim.',
          claimsTable
        );
        break;
      case 'ver':
        populateClaim(
          key,
          claims[key],
          'Version of the token issued by the Microsoft identity platform',
          claimsTable
        );
        break;
      case 'login_hint':
        populateClaim(
          key,
          claims[key],
          'An opaque, reliable login hint claim. This claim is the best value to use for the login_hint OAuth parameter in all flows to get SSO.',
          claimsTable
        );
        break;
      case 'idtyp':
        populateClaim(
          key,
          claims[key],
          'Value is app when the token is an app-only token. This is the most accurate way for an API to determine if a token is an app token or an app+user token',
          claimsTable
        );
        break;
      case 'uti':
      case 'rh':
        break;
      default:
        populateClaim(key, claims[key], '', claimsTable);
    }
  });

  return claimsTable;
};

/**
 * Populates claim, description, and value into an claimsObject
 * @param {String} claim
 * @param {String} value
 * @param {String} description
 * @param {Array} claimsObject
 */
const populateClaim = (
  claim: string,
  value: string,
  description: string,
  claimsTable: any[]
): void => {
  claimsTable.push({
    claim: claim,
    value: value,
    description: description,
  });
};

/**
 * Transforms Unix timestamp to date and returns a string value of that date
 * @param {number} date Unix timestamp
 * @returns
 */
const changeDateFormat = (date: number) => {
  let dateObj = new Date(date * 1000);
  return `${date} - [${dateObj.toString()}]`;
};
