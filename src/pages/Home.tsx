import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <Card className="p-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your App</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your project has been successfully imported from GitHub and is now running!
        </p>
        <div className="flex gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
        </div>
      </Card>
    </div>
  );
};

export default Home;