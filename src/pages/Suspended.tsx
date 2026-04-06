import { Link } from "react-router-dom";
import { ShieldAlert, Mail, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Suspended = () => {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {/* Main message */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your GMV.live account has been suspended due to a policy violation or administrative action.
          </p>
        </div>

        {/* Details card */}
        <Card className="border-destructive/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  While your account is suspended, you <strong className="text-foreground">cannot</strong>:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Access your dashboard or deals</li>
                  <li>Send or receive messages</li>
                  <li>Create or modify products</li>
                  <li>Receive payments or payouts</li>
                </ul>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">What can I do?</p>
              <p className="text-sm text-muted-foreground">
                If you believe this is an error or would like to appeal, please contact our support team.
                Include your account email and any relevant details in your message.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full gap-2" size="lg">
            <a href="mailto:support@gmv.live?subject=Account%20Suspension%20Appeal">
              <Mail className="h-4 w-4" /> Contact Support — support@gmv.live
            </a>
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleSignOut}>
              <ArrowLeft className="h-4 w-4" /> Sign Out
            </Button>
            <Button variant="ghost" className="flex-1" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Suspensions are typically reviewed within 1–3 business days.
        </p>
      </div>
    </div>
  );
};

export default Suspended;
