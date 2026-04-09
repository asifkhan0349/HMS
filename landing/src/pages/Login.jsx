import * as React from "react"
import { useSearchParams, Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Hospital, ArrowLeft, Mail, Lock, User, Send } from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { MouseGlow } from "../components/ui/effects/mouse-glow"

export default function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mode = searchParams.get("mode") || "login"
  const isLogin = mode === "login"

  // Use VITE_APP_URL environment variable to redirect to main app.
  // In development, the Main Application runs on port 5173.
  const defaultAppUrl = import.meta.env.DEV ? 'http://localhost:5173' : window.location.origin;
  const appUrl = import.meta.env.VITE_APP_URL || defaultAppUrl;

  const handleAuthRedirect = (targetMode) => {
    // Redirect to the main app's login/signup page
    window.location.href = `${appUrl}/login?mode=${targetMode}`;
  };

  React.useEffect(() => {
    document.title = isLogin ? "Login | HMS" : "Sign Up | HMS"
  }, [isLogin])

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary/30 selection:text-primary">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <MouseGlow
        color="rgba(220, 38, 38, 0.1)"
        size={600}
        blur={150}
        opacity={0.5}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex justify-between items-center mb-8">
          <Link to="/" className="flex items-center space-x-2 no-underline text-foreground group">
            <div className="p-2 rounded-lg bg-background border border-border/40 group-hover:border-primary/40 transition-colors shadow-sm">
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Back to Home</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Hospital className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">HMS</span>
          </div>
        </div>

        <Card className="border-border/40 shadow-2xl bg-background/60 backdrop-blur-xl rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <CardHeader className="space-y-1 pb-6 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              {isLogin 
                ? "Enter your credentials to access your dashboard" 
                : "Join thousands of healthcare professionals today"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative group/input">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                  <Input 
                    id="name" 
                    placeholder="Dr. John Doe" 
                    className="pl-10 h-11 bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/20 rounded-xl transition-all"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative group/input">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@hms.com" 
                  className="pl-10 h-11 bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Button variant="link" className="px-0 font-normal h-auto text-muted-foreground hover:text-primary no-underline text-xs">
                    Forgot password?
                  </Button>
                )}
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 h-11 bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center space-x-2 pt-1">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary/20 accent-primary" 
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                  Remember me for 30 days
                </label>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
              onClick={() => handleAuthRedirect(isLogin ? "login" : "signup")}
            >
              {isLogin ? "Sign In" : "Get Started"}
              <Send className="h-4 w-4" />
            </Button>
            
            <div className="text-center text-sm text-muted-foreground pt-2">
              {isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => handleAuthRedirect('signup')}
                    className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 bg-transparent border-none p-0 inline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button 
                    onClick={() => handleAuthRedirect('login')}
                    className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 bg-transparent border-none p-0 inline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
        
        <p className="mt-8 text-center text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy. Secure processing by HMS Protocol.
        </p>
      </motion.div>
    </div>
  )
}
