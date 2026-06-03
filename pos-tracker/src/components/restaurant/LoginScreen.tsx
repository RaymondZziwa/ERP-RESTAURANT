import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table2 } from "lucide-react";
import { useRestaurant } from "@/lib/restaurant-store";
import { baseURL } from "@/lib/api/apiConfig";
import { AuthEndpoints } from "@/endpoints/auth/authEndpoints";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchDataStart,
  fetchDataSuccess,
  fetchDataFailure,
} from "../../redux/slices/auth/userAuthSlice";
import { toast } from "sonner";

export function LoginScreen() {
  const { login } = useRestaurant();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Auto-submit when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4 && !isLoading && !isSubmittingRef.current) {
      const timer = setTimeout(() => {
        handleSubmit(new Event("submit") as unknown as React.FormEvent);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    dispatch(fetchDataStart());

    try {
      const response = await axios.post(
        `${baseURL}${AuthEndpoints.PIN_LOGIN}`,
        { pin },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          timeout: 10000,
        }
      );

      console.log("Login response:", response.data.user);
      login(pin);
      dispatch(fetchDataSuccess(response.data.user));
      toast.success("Login successful!");
      navigate("/");
    } catch (error: unknown) {
      console.error("Login failed:", error);
      setPin("");
      setError(true);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          toast.error(
            (error.response.data as { message?: string })?.message ||
              "Invalid PIN. Please try again."
          );
        } else if (error.request) {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error("An unexpected error occurred");
        }
        dispatch(fetchDataFailure(error.message));
      } else {
        toast.error("An unexpected error occurred");
        dispatch(
          fetchDataFailure(
            error instanceof Error ? error.message : "Login failed"
          )
        );
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const press = (n: string) => {
    if (isLoading) return;
    setError(false);
    if (pin.length >= 4) return;
    setPin(pin + n);
  };

  const clear = () => {
    if (isLoading) return;
    setPin("");
    setError(false);
  };

  const handleDelete = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-sm p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3 text-primary shadow-sm">
            <Table2 className="h-8 w-8" />
          </div>
          <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-2xl font-bold text-transparent">
            Table Manager
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2">
                Verifying...
                <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
              </span>
            ) : (
              "Enter your 4-digit PIN"
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  pin.length > i
                    ? "border-primary bg-primary scale-110"
                    : "border-muted-foreground/30 bg-background"
                } ${error ? "border-destructive bg-destructive/20" : ""} ${
                  isLoading ? "opacity-50" : ""
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 animate-shake text-center text-sm text-destructive">
              <span className="inline-block rounded-md bg-destructive/10 px-3 py-1">
                ⚠️ Invalid PIN. Please try again.
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <Button
                key={n}
                type="button"
                variant="outline"
                className="h-14 text-xl font-semibold transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
                onClick={() => press(n)}
                disabled={isLoading}
              >
                {n}
              </Button>
            ))}

            <Button
              type="button"
              variant="ghost"
              className="h-14 transition-all hover:scale-105 hover:bg-destructive/10 hover:text-destructive"
              onClick={clear}
              disabled={isLoading}
            >
              Clear
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-14 text-xl font-semibold transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground"
              onClick={() => press("0")}
              disabled={isLoading}
            >
              0
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-14 text-xl transition-all hover:scale-105 hover:bg-secondary"
              onClick={handleDelete}
              disabled={isLoading}
            >
              ⌫
            </Button>
          </div>

          <button type="submit" className="hidden" />
        </form>

        {isLoading && (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </Card>
    </div>
  );
}

// Add this to your global CSS or component styles
const styles = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}
`;