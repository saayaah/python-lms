from app.security import hash_password, verify_password


def test_password_hash_is_not_reversible_plaintext() -> None:
    password = "correct horse battery staple"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong password", hashed)
