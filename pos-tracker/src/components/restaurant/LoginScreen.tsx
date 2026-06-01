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

  // Ref to track if submission is in progress
  const isSubmittingRef = useRef(false);

  // Auto-submit when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length === 4 && !isLoading && !isSubmittingRef.current) {
      // Small delay to ensure state is updated
      const timer = setTimeout(() => {
        handleSubmit(new Event("submit") as unknown as React.FormEvent);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [pin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple submissions
    if (isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsLoading(true);
    dispatch(fetchDataStart());

    try {
      const response = await axios.post(
        `${baseURL}${AuthEndpoints.PIN_LOGIN}`,
        {
          pin,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
          timeout: 10000, // 10 second timeout
        },
      );

      console.log("Login response:", response.data.user);

      // Call the restaurant store login
      login(pin);

      // Dispatch success action if needed
      dispatch(fetchDataSuccess(response.data.user));

      toast.success("Login successful!");
      navigate("/");
    } catch (error: unknown) {
      console.error("Login failed:", error);

      // Reset PIN on error
      setPin("");
      setError(true);

      // Handle different error types
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with error status
          console.error("Server error:", error.response.data);
          toast.error(
            (error.response.data as { message?: string })?.message ||
              "Invalid PIN. Please try again.",
          );
        } else if (error.request) {
          // Request was made but no response received
          console.error("Network error:", error.request);
          toast.error("Network error. Please check your connection.");
        } else {
          // Something else happened
          console.error("Error:", error.message);
          toast.error("An unexpected error occurred");
        }

        // Dispatch failure action if needed
        dispatch(fetchDataFailure(error.message));
      } else {
        toast.error("An unexpected error occurred");
        dispatch(
          fetchDataFailure(
            error instanceof Error ? error.message : "Login failed",
          ),
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
    const next = pin + n;
    setPin(next);
    // Remove the old setTimeout that was calling login
  };

  const clear = () => {
    if (isLoading) return;
    setPin("");
    setError(false);
  };

  // Optional: Handle backspace/delete key
  const handleDelete = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Table2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Table Manager</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Verifying..." : "Enter your 4-digit PIN"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex justify-center gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  pin.length > i
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                } ${error ? "border-destructive" : ""} ${
                  isLoading ? "opacity-50" : ""
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="mb-2 text-center text-sm text-destructive">
              Invalid PIN. Please try again.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <Button
                key={n}
                type="button"
                variant="outline"
                className="h-14 text-xl"
                onClick={() => press(n)}
                disabled={isLoading}
              >
                {n}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              className="h-14"
              onClick={clear}
              disabled={isLoading}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 text-xl"
              onClick={() => press("0")}
              disabled={isLoading}
            >
              0
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 text-xl"
              onClick={handleDelete}
              disabled={isLoading}
            >
              ⌫
            </Button>
          </div>

          {/* Hidden submit button for form submission */}
          <button type="submit" className="hidden" />
        </form>

        {isLoading && (
          <div className="mt-4 flex justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </Card>
    </div>
  );
}
