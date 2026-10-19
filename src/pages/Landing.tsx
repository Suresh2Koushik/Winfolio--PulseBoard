import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Zap, Shield, BarChart3 } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pulseboard
            </span>
          </div>
          <Link to="/auth">
            <Button variant="outline">Sign In</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Pulseboard
            </span>
            <br />
            <span className="text-foreground">Your Year, in Motion</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Capture your wins as they happen, keep your manager in the loop,
            and turn a year of work into a review-ready story — in minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/auth">
              <Button size="lg" className="gap-2 text-lg px-8 py-6">
                Try Pulseboard
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
            Ever been asked,{" "}
            <span className="text-primary">"So what have you been working on lately?"</span>
          </h2>
          
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-lg border border-border space-y-4">
            <p className="text-lg text-muted-foreground leading-relaxed">
              And suddenly… your mind goes blank?
            </p>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              If you work cross-functionally, that happens a lot. You collaborate across Product, CX, 
              Sales, and Marketing — but when it's time to reflect, everything feels scattered.
            </p>
            
            <p className="text-lg text-primary font-medium">
              Spreadsheets help, but they're passive. You don't need another tracker — 
              you need a system that remembers for you.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="container mx-auto px-4 py-20 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Core Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Categorization</h3>
              <p className="text-muted-foreground">
                Auto-detects your work type and teams involved
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weekly & Monthly Insights</h3>
              <p className="text-muted-foreground">
                Visualize progress and effort distribution
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Summaries</h3>
              <p className="text-muted-foreground">
                Export review-ready reports in one click
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <p className="font-medium">PulseBoard</p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PulseBoard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
