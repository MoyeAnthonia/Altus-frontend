import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/useAuth";
import { loginUser, registerUser } from "../../api/auth";
import { Spinner } from "../../components/Spinner/Spinner";
import styles from "./Login.module.css";

type LoginInputs = {
  email: string;
  password: string;
};

type RegisterInputs = {
  username: string;
  email: string;
  password: string;
};

function LoginPage() {
  // controls which form is showing inside the card
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ── LOGIN FORM ──
  // its own useForm instance, scoped just to email + password
  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    setError: setLoginError,
    formState: { errors: loginErrors },
  } = useForm<LoginInputs>();

  const onLoginSubmit: SubmitHandler<LoginInputs> = async (data) => {
    setIsLoading(true);

    try {
      const result = await loginUser(data.email, data.password);
      login(result.token, result.user);
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        setLoginError("root", { message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── REGISTER FORM ──
  // a second, separate useForm instance for username + email + password
  const {
    register: registerRegisterField,
    handleSubmit: handleRegisterSubmit,
    setError: setRegisterError,
    formState: { errors: registerErrors },
  } = useForm<RegisterInputs>();

  const onRegisterSubmit: SubmitHandler<RegisterInputs> = async (data) => {
    setIsLoading(true);

    try {
      const result = await registerUser(data.username, data.email, data.password);
      // straight into the app after registering, same as a normal login
      login(result.token, result.user);
      navigate("/");
    } catch (error) {
      if (error instanceof Error) {
        setRegisterError("root", { message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.lgPage}>
      {/* LEFT – branding panel (unchanged) */}
      <div className={styles.lgLeft}>
        <div className={`${styles.lgCorner} ${styles.lgCornerTl}`}></div>
        <div className={`${styles.lgCorner} ${styles.lgCornerTr}`}></div>
        <div className={`${styles.lgCorner} ${styles.lgCornerBl}`}></div>
        <div className={`${styles.lgCorner} ${styles.lgCornerBr}`}></div>

        <div className={styles.lgBrand}>
          <svg
            className={styles.lgLogoMark}
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Altus logo"
          >
            <circle cx="40" cy="14" r="10" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="40" y1="24" x2="40" y2="52" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="40" y1="34" x2="22" y2="46" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="40" y1="34" x2="58" y2="46" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="40" y1="52" x2="26" y2="70" stroke="#38e1ff" strokeWidth="2.5" />
            <line x1="40" y1="52" x2="54" y2="70" stroke="#38e1ff" strokeWidth="2.5" />
            <circle cx="22" cy="46" r="4" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="58" cy="46" r="4" stroke="#f59e0b" strokeWidth="2" />
          </svg>

          <span className={styles.lgBrandName}>Altus</span>

          <p className={styles.lgTagline}>
            Turn every push-up and squat into a game. Your body is the controller.
          </p>

          <div className={styles.lgStats}>
            <div className={styles.lgStatPill}>
              <span className={styles.lgStatPillIcon}>🔥</span>
              Streak Tracking
            </div>
            <div className={styles.lgStatPill}>
              <span className={styles.lgStatPillIcon}>⚡</span>
              XP &amp; Badges
            </div>
            <div className={styles.lgStatPill}>
              <span className={styles.lgStatPillIcon}>🎮</span>2 Games
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT – form panel, swaps between login + register */}
      <div className={styles.lgRight}>
        <div className={styles.lgCard}>
          {mode === "login" ? (
            <>
              <h1 className={styles.lgCardTitle}>Welcome Back</h1>
              <p className={styles.lgCardSubtitle}>Sign in to continue your streak</p>

              <div className={styles.lgForm}>
                <form onSubmit={handleLoginSubmit(onLoginSubmit)}>
                  <div className={styles.lgField}>
                    <label className={styles.lgLabel} htmlFor="email">
                      Email
                    </label>
                    <input
                      {...registerLoginField("email", { required: true })}
                      id="email"
                      type="email"
                      className={styles.lgInput}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {loginErrors.email && <span>This email field is required</span>}
                  </div>

                  <div className={styles.lgField}>
                    <label className={styles.lgLabel} htmlFor="password">
                      Password
                    </label>
                    <div className={styles.lgInputWrap}>
                      <input
                        {...registerLoginField("password", { required: true })}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className={styles.lgInput}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      {loginErrors.password && <span>This password field is required</span>}
                      <button
                        type="button"
                        className={styles.lgToggleBtn}
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {loginErrors.root && (
                    <span className={styles.lgError}>{loginErrors.root.message}</span>
                  )}

                  <button type="submit" className={styles.lgSubmitBtn} disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" label="Signing in..." /> : "Play Now →"}
                  </button>

                  {/* <button type="button" className={styles.lgForgot}>
                    Forgot password?
                  </button> */}
                </form>
              </div>

              <p className={styles.lgSignupPrompt}>
                No account yet?
                <button
                  type="button"
                  className={styles.lgSignupLink}
                  onClick={() => setMode("register")}
                >
                  Sign up free
                </button>
              </p>
            </>
          ) : (
            <>
              <h1 className={styles.lgCardTitle}>Create Account</h1>
              <p className={styles.lgCardSubtitle}>Start your streak today</p>

              <div className={styles.lgForm}>
                <form onSubmit={handleRegisterSubmit(onRegisterSubmit)}>
                  <div className={styles.lgField}>
                    <label className={styles.lgLabel} htmlFor="username">
                      Username
                    </label>
                    <input
                      {...registerRegisterField("username", { required: true })}
                      id="username"
                      type="text"
                      className={styles.lgInput}
                      placeholder="your username"
                      autoComplete="username"
                    />
                    {registerErrors.username && <span>This username field is required</span>}
                  </div>

                  <div className={styles.lgField}>
                    <label className={styles.lgLabel} htmlFor="registerEmail">
                      Email
                    </label>
                    <input
                      {...registerRegisterField("email", { required: true })}
                      id="registerEmail"
                      type="email"
                      className={styles.lgInput}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    {registerErrors.email && <span>This email field is required</span>}
                  </div>

                  <div className={styles.lgField}>
                    <label className={styles.lgLabel} htmlFor="registerPassword">
                      Password
                    </label>
                    <div className={styles.lgInputWrap}>
                      <input
                        {...registerRegisterField("password", { required: true, minLength: 6 })}
                        id="registerPassword"
                        type={showPassword ? "text" : "password"}
                        className={styles.lgInput}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      {registerErrors.password && (
                        <span>Password must be at least 6 characters</span>
                      )}
                      <button
                        type="button"
                        className={styles.lgToggleBtn}
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  {registerErrors.root && (
                    <span className={styles.lgError}>{registerErrors.root.message}</span>
                  )}

                  <button type="submit" className={styles.lgSubmitBtn} disabled={isLoading}>
                    {isLoading ? (
                      <Spinner size="sm" label="Creating account..." />
                    ) : (
                      "Create Account →"
                    )}
                  </button>
                </form>
              </div>

              <p className={styles.lgSignupPrompt}>
                Already have an account?
                <button
                  type="button"
                  className={styles.lgSignupLink}
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
