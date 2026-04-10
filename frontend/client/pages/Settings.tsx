import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  FolderTree,
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  RotateCcw,
  Settings as SettingsIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  api,
  MetadataItem,
  MetadataType,
} from "@/lib/api";

type TabType = MetadataType;

interface EditingItem {
  id: number;
  value: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabType>("departments");
  const [departments, setDepartments] = useState<MetadataItem[]>([]);
  const [categories, setCategories] = useState<MetadataItem[]>([]);
  const [staff, setStaff] = useState<MetadataItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      const [departmentData, categoryData, staffData] = await Promise.all([
        api.getMetadata("departments"),
        api.getMetadata("categories"),
        api.getMetadata("staff"),
      ]);

      setDepartments(departmentData);
      setCategories(categoryData);
      setStaff(staffData);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load settings data");
    }
  };

  const getCurrentData = (): MetadataItem[] => {
    switch (activeTab) {
      case "departments":
        return departments;
      case "categories":
        return categories;
      case "staff":
        return staff;
    }
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case "departments":
        return Building2;
      case "categories":
        return FolderTree;
      case "staff":
        return Users;
    }
  };

  const getTabLabel = (tab: TabType): string => {
    switch (tab) {
      case "departments":
        return "Departments";
      case "categories":
        return "Categories";
      case "staff":
        return "IT Staff";
    }
  };

  const handleAdd = async () => {
    if (!newItem.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const result = await api.createMetadata(activeTab, newItem.trim());

      toast.success(result.message);
      refreshData();
      setNewItem("");
      setIsAddingNew(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to add entry");
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !editingItem.value.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const result = await api.updateMetadata(activeTab, editingItem.id, editingItem.value.trim());

      toast.success(result.message);
      refreshData();
      setEditingItem(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to update entry");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const result = await api.deleteMetadata(activeTab, id);

      toast.success(result.message);
      refreshData();
      setDeleteConfirm(null);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to delete entry");
    }
  };

  const handleReset = async () => {
    try {
      const result = await api.resetMetadata();
      refreshData();
      toast.success(result.message);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to reset metadata");
    }
  };

  const tabs: TabType[] = ["departments", "categories", "staff"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border"
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage departments, categories, and IT staff
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              "border border-input text-foreground hover:bg-muted"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-lg">
            {tabs.map((tab) => {
              const Icon = getTabIcon(tab);
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setEditingItem(null);
                    setIsAddingNew(false);
                    setDeleteConfirm(null);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium transition-all",
                    activeTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {getTabLabel(tab)}
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {tab === "departments"
                      ? departments.length
                      : tab === "categories"
                      ? categories.length
                      : staff.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Management Card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getTabIcon(activeTab);
                  return (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Manage {getTabLabel(activeTab)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, or remove {getTabLabel(activeTab).toLowerCase()}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingItem(null);
                }}
                disabled={isAddingNew}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
                Add New
              </motion.button>
            </div>

            {/* Add New Item Form */}
            <AnimatePresence>
              {isAddingNew && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-border overflow-hidden"
                >
                  <div className="p-4 bg-primary/5 flex items-center gap-3">
                    <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAdd();
                        if (e.key === "Escape") {
                          setIsAddingNew(false);
                          setNewItem("");
                        }
                      }}
                      placeholder={`Enter new ${activeTab === "staff" ? "staff name" : activeTab.slice(0, -1)} name...`}
                      autoFocus
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      )}
                    />
                    <button
                      onClick={handleAdd}
                      className="p-2.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewItem("");
                      }}
                      className="p-2.5 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Items List */}
            <div className="max-h-[500px] overflow-y-auto">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="divide-y divide-border"
              >
                {getCurrentData().map((item, index) => (
                  <motion.div
                    key={`${activeTab}-${item.id}`}
                    variants={itemVariants}
                    className={cn(
                      "flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors",
                      deleteConfirm === item.id && "bg-red-50 dark:bg-red-950/20"
                    )}
                  >
                    {/* Index Badge */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0">
                      {index + 1}
                    </div>

                    {/* Content */}
                    {editingItem?.id === item.id ? (
                      // Edit Mode
                      <div className="flex-1 flex items-center gap-3">
                        <input
                          type="text"
                          value={editingItem.value}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, value: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate();
                            if (e.key === "Escape") setEditingItem(null);
                          }}
                          autoFocus
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg border border-primary bg-background text-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          )}
                        />
                        <button
                          onClick={() => handleUpdate()}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingItem(null)}
                          className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : deleteConfirm === item.id ? (
                      // Delete Confirmation Mode
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          Delete "{item.name}"?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <span className="flex-1 text-foreground font-medium">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingItem({ id: item.id, value: item.name })}
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(item.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Empty State */}
              {getCurrentData().length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const Icon = getTabIcon(activeTab);
                      return <Icon className="w-8 h-8 text-muted-foreground" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    No {getTabLabel(activeTab).toLowerCase()} yet
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Add New" to create your first entry
                  </p>
                  <button
                    onClick={() => setIsAddingNew(true)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                      "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Add {activeTab === "staff" ? "Staff Member" : activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {getCurrentData().length > 0 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Total: {getCurrentData().length} {getTabLabel(activeTab).toLowerCase()}
                </p>
              </div>
            )}
          </motion.div>

          {/* Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20"
          >
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span> Changes are saved in your backend database.
              Use the "Reset to Defaults" button to restore the original data if needed.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
