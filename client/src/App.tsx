import { useState } from "react";
import { Router, Switch, Route } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Toaster } from "@/components/ui/toaster";
import MortgageCalculator from "@/pages/MortgageCalculator";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/" component={MortgageCalculator} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </Router>
  );
}

export default App;
