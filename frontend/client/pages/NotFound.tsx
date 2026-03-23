import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
          <p className="text-2xl font-semibold text-foreground">
            Page Not Found
          </p>
        </div>

        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist. This might be a page that
          still needs to be built. Let us know what you'd like to add!
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all"
        >
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
