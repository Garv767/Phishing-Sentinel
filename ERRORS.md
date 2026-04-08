# Phishing Sentinel — Error Directory

This document lists all standardized error codes encountered in the Phishing Sentinel Network. When you see an error code (e.g., `[ERR_NET_001]`) in the application interface, refer to the corresponding section below for detailed technical information and resolution steps.

---

## Network Errors

### <a name="ERR_NET_001"></a> `[ERR_NET_001]` API Connection Offline
**Description**: The dashboard or extension is unable to establish a secure connection with the core Sentinel API server.
**Common Causes**:
- The API instance hosted on Render/cloud provider is asleep due to inactivity (Cold Start).
- Your network is blocking HTTPS traffic to the server.
**Resolution**: Wait approximately 10-20 seconds and click the "Reconnect" button or refresh the page. This allows the server to wake up from its sleep cycle.

### <a name="ERR_NET_002"></a> `[ERR_NET_002]` Extension Deep Scan Timeout
**Description**: The extension sent DOM telemetry to the Sentinel API for a deep scan, but the server failed to respond within the 15-second grace period.
**Resolution**: Reload the target webpage to re-initialize the scanning sequence.

---

## Authentication and Security Errors

### <a name="ERR_AUTH_001"></a> `[ERR_AUTH_001]` Invalid Credentials
**Description**: The Operative ID (Email) or Security Key (Password) provided does not match any active operative on the network.
**Resolution**: Double-check your credentials. If you are a new operative, ensure you have requested access via the induction portal.

### <a name="ERR_AUTH_002"></a> `[ERR_AUTH_002]` Registration Rejected
**Description**: The induction portal failed to create a new profile.
**Common Causes**:
- An operative with this email is already registered on the network.
- The server rejected the password due to internal policies constraint.
**Resolution**: Proceed to Login if you are already registered, or try a different Operative ID.

### <a name="ERR_AUTH_003"></a> `[ERR_AUTH_003]` Unauthorized Access
**Description**: The session token provided to the Sentinel API is expired, invalid, or missing entirely.
**Resolution**: The system should automatically log you out. Re-authenticate via the Login form to generate a fresh Secure Token.

---

## Validation Errors

### <a name="ERR_VAL_001"></a> `[ERR_VAL_001]` Key Mismatch
**Description**: The verification security key provided during Profile Creation does not match the initial key.
**Resolution**: Carefully re-type your chosen Security Key into both the "Create Key" and "Confirm Key" fields.

---

*For further assistance, file a report with Sentinel Network Operations.*
