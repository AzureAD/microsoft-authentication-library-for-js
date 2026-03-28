import requests
import time
import json
import urllib.parse
import re

# Mail.tm API URLs
MAIL_TM_DOMAINS_API_URL = "https://api.mail.tm/domains"
MAIL_TM_ACCOUNTS_API_URL = "https://api.mail.tm/accounts"
MAIL_TM_TOKEN_API_URL = "https://api.mail.tm/token"
MAIL_TM_MESSAGES_API_URL = "https://api.mail.tm/messages"
MAIL_TM_SOURCES_API_URL = "https://api.mail.tm/sources/"

# Remote signup server URLs (updated to the new endpoint)
SIGNUP_API_URL = "https://MSIDLABCIAM6.ciamlogin.com/fe362aec-5d43-45d1-b730-9755e60dc3b9/signup/v1.0/start"
CHALLENGE_API_URL = "https://MSIDLABCIAM6.ciamlogin.com/fe362aec-5d43-45d1-b730-9755e60dc3b9/signup/v1.0/challenge"

# Common headers for all mail.tm API calls
HEADERS_JSON = {
    "Content-Type": "application/json"
}

# URL-encoded header for signup request
HEADERS_URLENCODED = {
    "Content-Type": "application/x-www-form-urlencoded"
}

# Function to fetch the domain from Mail.tm API
def fetch_and_extract_domain():
    try:
        response = requests.get(MAIL_TM_DOMAINS_API_URL, headers=HEADERS_JSON)
        
        if response.status_code == 200:
            data = response.json()
            domain = data["hydra:member"][0]["domain"]
            print(f"Fetched domain: {domain}")
            return domain
        else:
            print(f"Error fetching domains: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during API request: {e}")
        return None

# Function to create a new Mail.tm account
def create_account(domain):
    if domain is None:
        print("No domain available to create an account.")
        return None, None

    # Generate the unique email address using epoch time (avoid '+' sign)
    current_time = int(time.time())  # Get current epoch time
    email_address = f"test{current_time}@{domain}"  # Removed '+' sign
    password = "Password123!"  # Static password as per your request

    payload = {
        "address": email_address,
        "password": password
    }
    print(f"Account creating! Email: {email_address}")


    # Send POST request to create the account (using data=payload for URL-encoded)
    try:
        response = requests.post(MAIL_TM_ACCOUNTS_API_URL, json=payload, headers=HEADERS_JSON)

        if response.status_code == 201:
            print(f"Account successfully created! Email: {email_address}")
            return email_address, password
        else:
            print(f"Failed to create account: {response.status_code} - {response.text}")
            return None, None
    except Exception as e:
        print(f"Error during account creation request: {e}")
        return None, None

# Function to get the authentication token for the created account
def get_auth_token(email, password):
    if email is None or password is None:
        print("Invalid email or password. Cannot get token.")
        return None

    # URL-encoded payload for token request
    payload = {
        "address": email,
        "password": password
    }

    # Send POST request to /token endpoint (using data=payload for URL-encoded)
    try:
        response = requests.post(MAIL_TM_TOKEN_API_URL, json=payload, headers=HEADERS_JSON)

        if response.status_code == 200:
            # Successfully received the token
            data = response.json()
            token = data.get("token", None)
            if token:
                print(f"Authentication token received.")
                return token
            else:
                print("Failed to get token: Token not found in response.")
                return None
        else:
            print(f"Failed to get token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during token request: {e}")
        return None


# Function to trigger the signup process on the remote server
def trigger_signup(email):
    if email is None:
        print("No email to start signup.")
        return None

    # Construct the URL-encoded payload for the signup API
    attributes = json.dumps({
        "givenName": "Yongdi",
        "surname": "W",
        "city": "Dublin",
        "country": "Ireland"
    })

    payload = {
        "client_id": "eb5a6da5-79fc-4d81-8d45-0ee1e8d4bd16",  # example client_id
        "username": email,  # Make sure 'username' is correctly included
        "attributes": attributes,  # Serialize nested attributes
        "challenge_type": "password oob redirect"
    }

    # URL encode the payload (application/x-www-form-urlencoded format)
    encoded_payload = urllib.parse.urlencode(payload)

    # Log the final URL and encoded payload for debugging
    # print(f"Triggering signup with URL: {SIGNUP_API_URL}")
    # print(f"Encoded Payload: {encoded_payload}")

    # Send POST request to the remote signup API with URL-encoded data
    try:
        response = requests.post(SIGNUP_API_URL, data=encoded_payload, headers=HEADERS_URLENCODED)

        # Print the raw response status and body for debugging
        # print(f"Response Status Code: {response.status_code}")
        # print(f"Response Text: {response.text}")

        if response.status_code == 200:
            # Signup started successfully, now get continuation_token
            data = response.json()  # This is assuming that the response will be JSON
            continuation_token = data.get("continuation_token")
            if continuation_token:
                print(f"Signup started successfully.")
                return continuation_token
            else:
                print("Error: continuation_token not found in response.")
                return None
        else:
            print(f"Failed to trigger signup: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during signup request: {e}")
        return None


# Function to send the challenge request to continue the signup
def send_challenge_request(continuation_token):
    if continuation_token is None:
        print("No continuation_token provided.")
        return None

    # Construct the URL-encoded payload for the challenge API
    payload = {
        "client_id": "eb5a6da5-79fc-4d81-8d45-0ee1e8d4bd16",  # example client_id
        "continuation_token": continuation_token,
        "challenge_type": "password oob redirect"
    }

    # Send POST request to the challenge API (using data=payload for URL-encoded)
    try:
        response = requests.post(CHALLENGE_API_URL, data=payload, headers=HEADERS_URLENCODED)

        if response.status_code == 200:
            print(f"Challenge request completed successfully.")
            return response.json()
        else:
            print(f"Failed to complete challenge request: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during challenge request: {e}")
        return None


# Function to check email for OTP
def check_email_for_otp(token):
    time.sleep(30) # Wait for 5 seconds to ensure the email has been sent

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"  # Ensure the Content-Type is set to application/json
    }

    try:
        # Send GET request to retrieve emails
        response = requests.get(MAIL_TM_MESSAGES_API_URL, params={"page": 1}, headers=headers)

        if response.status_code == 200:
            data = response.json()  # Parse the response as JSON
            
            # Ensure "hydra:member" exists and is not empty
            if "hydra:member" in data and len(data["hydra:member"]) > 0:
                # Extract subject and intro of the first email
                email_subject = data["hydra:member"][0]["subject"]
                email_intro = data["hydra:member"][0]["intro"]
                messageId = data["hydra:member"][0]["id"]
                updatedAt = data["hydra:member"][0]["updatedAt"]

                print(f"  Email Subject: {email_subject}")
                print(f"  Email Intro: {email_intro}")
                print(f"  Message ID: {messageId}")
                print(f"  Updated At: {updatedAt}")
                
                # Fetch message source after getting the email details
                otp_code = get_message_source(messageId, headers)  # Fetch OTP code from message source
                if otp_code:
                    print(f"OTP Code Found: {otp_code}")
                return email_subject, email_intro, messageId, updatedAt
            else:
                print("No emails found in the response.")
                return None, None, None, None
        else:
            print(f"Failed to fetch emails. Status code: {response.status_code}, Response: {response.text}")
            return None, None, None, None
    except Exception as e:
        print(f"Error while checking email for OTP: {e}")
        return None, None, None, None


# Function to get message source and extract OTP code
def get_message_source(message_id, headers):
    try:
        # Send GET request to fetch message source using message_id
        source_url = MAIL_TM_SOURCES_API_URL + message_id
        response = requests.get(source_url, headers=headers)

        if response.status_code == 200:
            data = response.json()  # Parse the response as JSON
            
            # Ensure 'data' field is present in the response
            if "data" in data:
                message_data = data["data"]

                # Use regex to find the verification code (e.g., "Account verification code: 17354003")
                match = re.search(r"Account verification code:\s*(\d+)", message_data)
                if match:
                    otp_code = match.group(1)  # Extract the OTP code
                    return otp_code
                else:
                    print("OTP code not found in message data.")
                    return None
            else:
                print("'data' field not found in message source response.")
                return None
        else:
            print(f"Failed to fetch message source. Status code: {response.status_code}, Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error while fetching message source: {e}")
        return None


# Your previously defined functions like fetch_and_extract_domain, create_account, get_auth_token,
# trigger_signup, send_challenge_request, and check_email_for_otp should be included here.

if __name__ == "__main__":
    # Number of tests to run
    num_tests = 50
    
    # Initialize counters for successful and failed tests
    succeed_count = 0
    failed_count = 0

    # Initialize failure counters for specific steps
    account_creation_failed = 0
    token_failed = 0
    signup_failed = 0
    challenge_failed = 0
    otp_check_failed = 0

    for test_num in range(1, num_tests + 1):
        print(f"\nRunning Test {test_num}...")

        try:
            # Step 1: Fetch domain
            domain = fetch_and_extract_domain()

            # Step 2: Create account with fetched domain
            email, password = create_account(domain)
            
            # Check if account creation was successful
            if not email or not password:
                print(f"Account creation failed for domain: {domain}")
                account_creation_failed += 1
                raise Exception("Account creation failed.")

            # Step 3: If account creation is successful, get authentication token
            token = get_auth_token(email, password)

            # Step 4: Trigger the signup process with the created email
            if token:
                print(f"    Waiting for 10 seconds before proceeding with the signup...")
                time.sleep(10)  # 10 seconds delay after first signup call
                continuation_token = trigger_signup(email)

                # Step 5: After signup, continue with the challenge request
                if continuation_token:
                    challenge_response = send_challenge_request(continuation_token)

                    # Step 6: After challenge, wait for external email service to send OTP,
                    # and check for the OTP email
                    if challenge_response:
                        print(f"    Checking email for OTP (this may take a moment)...")
                        
                        # Call the check_email_for_otp function here after challenge request
                        email_subject, email_intro, messageId, updatedAt = check_email_for_otp(token)
                        
                        # If we were able to find an OTP email, print the details
                        if email_subject and email_intro:
                            print(f"  OTP Email found: Subject - {email_subject}, Intro - {email_intro}")
                        else:
                            otp_check_failed += 1
                            raise Exception("OTP email check failed.")
                    else:
                        print(f"Challenge request failed.")
                        challenge_failed += 1
                        raise Exception("Challenge request failed.")
                else:
                    print(f"Signup process failed.")
                    signup_failed += 1
                    raise Exception("Signup process failed.")
            else:
                print(f"Failed to get auth token.")
                token_failed += 1
                raise Exception("Failed to get auth token.")
            
            # If all steps are successful, increment succeed_count
            succeed_count += 1
            print(f"Test {test_num} succeeded.")
        
        except Exception as e:
            # If any error occurs, increment failed_count and continue to the next test
            failed_count += 1
            print(f"Test {test_num} failed. Error: {e}")

        # Step 7: Wait for 30 seconds before the next test
        print(f"Waiting 30 seconds before running the next test...")
        time.sleep(60)

    # Final output
    print(f"\nAll tests completed.")
    print(f"Successful Tests: {succeed_count}")
    print(f"Failed Tests: {failed_count}")
    
    # Print breakdown of failures by step
    print("\nFailure breakdown by step:")
    print(f"Account creation failed: {account_creation_failed}")
    print(f"Token retrieval failed: {token_failed}")
    print(f"Signup process failed: {signup_failed}")
    print(f"Challenge request failed: {challenge_failed}")
    print(f"OTP check failed: {otp_check_failed}")
