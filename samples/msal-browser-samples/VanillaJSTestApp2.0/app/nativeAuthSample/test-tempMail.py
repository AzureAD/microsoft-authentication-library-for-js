import requests
import json
import re
import time
import urllib.parse

# TempMail API URL for inbox check and email creation
BASE_URL = 'https://api.tempmail.lol/v2/inbox/create'
INBOX_URL = 'https://api.tempmail.lol/v2/inbox'

SIGNUP_API_URL = "https://MSIDLABCIAM6.ciamlogin.com/fe362aec-5d43-45d1-b730-9755e60dc3b9/signup/v1.0/start"
CHALLENGE_API_URL = "https://MSIDLABCIAM6.ciamlogin.com/fe362aec-5d43-45d1-b730-9755e60dc3b9/signup/v1.0/challenge"

# Header for URL-encoded data (example)
HEADERS_URLENCODED = {'Content-Type': 'application/x-www-form-urlencoded'}

# Function to create a temporary email address
def create_temp_email():
    try:
        response = requests.post(BASE_URL)
        response.raise_for_status()
        data = response.json()
        temp_email = data['address']
        token = data['token']
        print(f"Temporary email created: {temp_email}")
        return temp_email, token
    except requests.exceptions.RequestException as e:
        print(f"Error creating temporary email: {e}")
        return None, None

# Function to trigger the signup process with the temporary email
def trigger_signup(temp_email):
    if temp_email is None:
        print("No email to start signup.")
        return None

    attributes = json.dumps({
        "givenName": "Yongdi",
        "surname": "W",
        "city": "Dublin",
        "country": "Ireland"
    })

    payload = {
        "client_id": "eb5a6da5-79fc-4d81-8d45-0ee1e8d4bd16",  # example client_id
        "username": temp_email,  # Make sure 'username' is correctly included
        "attributes": attributes,  # Serialize nested attributes
        "challenge_type": "password oob redirect"
    }

    encoded_payload = urllib.parse.urlencode(payload)

    try:
        response = requests.post(SIGNUP_API_URL, data=encoded_payload, headers=HEADERS_URLENCODED)
        response.raise_for_status()

        if response.status_code == 200:
            data = response.json()
            continuation_token = data.get("continuation_token")
            if continuation_token:
                print(f"Signup started successfully for {temp_email}.")
                return continuation_token
            else:
                print("Error: continuation_token not found in response.")
                return None
        else:
            print(f"Failed to trigger signup for {temp_email}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error during signup request: {e}")
        return None

# Function to send the challenge request to continue the signup
def send_challenge_request(continuation_token):
    if continuation_token is None:
        print("No continuation_token provided.")
        return None

    payload = {
        "client_id": "eb5a6da5-79fc-4d81-8d45-0ee1e8d4bd16",  # example client_id
        "continuation_token": continuation_token,
        "challenge_type": "password oob redirect"
    }

    try:
        response = requests.post(CHALLENGE_API_URL, data=payload, headers=HEADERS_URLENCODED)
        if response.status_code == 200:
            print("Challenge request completed successfully.")
            return True
        else:
            print(f"Failed to complete challenge request: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"Error during challenge request: {e}")
        return False

# Function to check the inbox for the email and extract the verification code
def check_inbox(token):
    try:
        response = requests.get(f"{INBOX_URL}?token={token}")
        response.raise_for_status()  # Check if request was successful
        data = response.json()

        if data and 'emails' in data:
            print(f"Emails received in inbox: {len(data['emails'])}")

            if len(data['emails']) == 0:
                print("No emails found in the inbox.")
                raise ValueError("Inbox is empty")
            # Access the first email from the list
            email = data['emails'][0]
            print(f"Subject: {email['subject']}")
            print(f"Sender: {email['from']}")
            print(f"Body preview: {email['body'][:100]}...")  # Print the first 100 characters of the body

            # Extract account verification code using a regular expression
            match = re.search(r'Account verification code:\r\n(\d+)', email['body'])
            if match:
                verification_code = match.group(1)  # Extract the code
                print(f"Found Account Verification Code: {verification_code}")
                return verification_code
            else:
                print("No account verification code found in the email body.")
                return None
        else:
            print("No emails received yet.")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error checking inbox: {e}")
        return None

# Main function to run the test 30 times with delays
def main():
    succeed_count = 0
    failed_count = 0
    account_creation_failed = 0
    signup_failed = 0
    challenge_failed = 0
    otp_check_failed = 0
    # Failure logs to track what went wrong
    failure_logs = []

    for i in range(30):
        print(f"\n--- Running iteration {i + 1} ---")
        # Global counters for success and failure counts

        # Step 1: Create a temporary email address
        temp_email, token = create_temp_email()
        if not temp_email:
            account_creation_failed += 1
            failure_logs.append("Account creation failed: Temporary email could not be created.")

        # Step 2: Trigger the signup process with the temporary email
        continuation_token = trigger_signup(temp_email)
        if not continuation_token:
            signup_failed += 1
            failure_logs.append(f"Signup failed for {temp_email}: No continuation token returned.")

        # Step 3: Send the challenge request to continue the signup
        if not send_challenge_request(continuation_token):
            challenge_failed += 1
            failure_logs.append(f"Challenge request failed for token: {continuation_token}.")

        # Step 4: Wait for 10 seconds before checking inbox
        print("Waiting for 10 seconds before checking inbox...")
        time.sleep(10)

        # Step 5: Check the inbox for the email and extract the verification code
        verification_code = check_inbox(token)
        if verification_code:
            print(f"Verification Code: {verification_code}")
            succeed_count += 1  # Increment success counter for a full test success
        else:
            otp_check_failed += 1
            failure_logs.append(f"OTP check failed: No email found or no code in the email body.")
            
            # Wait for 30 seconds before running the next test
            if i < 29:  # No need to wait after the last iteration
                print("Waiting 30 seconds before next iteration...")
                time.sleep(30)
    # Final output
    print(f"\nAll tests completed.")
    print(f"Successful Tests: {succeed_count}")
    print(f"Failed Tests: {failed_count}")

    # Print final summary for each step's success/failure counts
    print("\nTest Summary:")
    print(f"Account Creation - Success: {account_creation_succeeded}, Failures: {account_creation_failed}")
    print(f"Signup Process - Success: {signup_succeeded}, Failures: {signup_failed}")
    print(f"Challenge Request - Success: {challenge_succeeded}, Failures: {challenge_failed}")
    print(f"OTP Check - Success: {otp_check_succeeded}, Failures: {otp_check_failed}")


if __name__ == "__main__":
    main()
