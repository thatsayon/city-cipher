from django.utils.text import slugify
from django.contrib.auth import get_user_model
from datetime import datetime, timezone, timedelta
from django.utils.timezone import now
import jwt
import uuid
import pyotp

User = get_user_model()

JWT_SECRET = "secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(minutes=10)

def generate_username(name):
    first_name = name.split()[0] if name else 'user'
    base_username = slugify(first_name)
    username = ''
    while True:
        username = f"{base_username}_{str(uuid.uuid4())[:8]}"
        if not User.objects.filter(username=username).exists():
            break
    return username

def generate_otp():
    totp = pyotp.TOTP(pyotp.random_base32(), interval=300)
    return totp.now()


def create_otp_token(payload):
    """
    Create a JWT token for OTP verification.
    
    Args:
        payload: Can be a string (user_id) or a dictionary of values
        
    Returns:
        str: JWT token
    """
    now = datetime.now(timezone.utc)
    
    # If payload is already a dict, use it; otherwise create one with user_id
    if isinstance(payload, dict):
        token_data = payload.copy()
        # Ensure user_id is a string if present
        if "user_id" in token_data:
            token_data["user_id"] = str(token_data["user_id"])
    else:
        # Assume payload is the user_id
        token_data = {"user_id": str(payload)}
    
    # Add standard JWT claims
    token_data.update({
        "exp": now + JWT_EXPIRATION_DELTA,
        "iat": now,
        "nbf": now,
    })
    
    return jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_otp_token(token):
    """
    Decode and verify the OTP token.
    
    Args:
        token (str): JWT token
        
    Returns:
        dict or None: Decoded payload dictionary or None if invalid
    """
    if not token:
        return None
        
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Token invalid
    except Exception:
        return None  # Any other error
