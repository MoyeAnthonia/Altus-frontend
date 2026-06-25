const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// register user
async function registerUser(username: string, email: string, password: string) {
  const response = await fetch(`${BASE_URL}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, password }),
  });

  // catch error
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Registration failed");
  }
  const data = await response.json();
  return data;
}

// login user
async function loginUser(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  // catch error
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? "Login Failed");
  }
  const data = await response.json();
  return data;
}

export { registerUser, loginUser };
