"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ExternalLink,
  Users,
  ShieldAlert,
} from "lucide-react";

export interface EmployeeDirectoryItem {
  id: string; // membershipId
  role: string;
  status: string;
  createdAt: Date | string;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  employeeProfile: {
    jobTitle: string | null;
    onboardingStatus: string;
    location: string | null;
    department: { id: string; name: string } | null;
    batch: { id: string; name: string } | null;
    manager: {
      user: {
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    } | null;
  } | null;
}

interface EmployeeDirectoryTableProps {
  initialMembers: EmployeeDirectoryItem[];
  departments: Array<{ id: string; name: string }>;
  batches: Array<{ id: string; name: string }>;
}

export function EmployeeDirectoryTable({
  initialMembers,
  departments,
  batches,
}: EmployeeDirectoryTableProps) {
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [onboardingFilter, setOnboardingFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("ALL");

  // Sorting state
  const [sortField, setSortField] = useState<"name" | "createdAt" | "status">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return initialMembers.filter((item) => {
      // 1. Search Query
      const q = search.toLowerCase().trim();
      const fullName = `${item.user.firstName || ""} ${item.user.lastName || ""}`.toLowerCase();
      const email = item.user.email.toLowerCase();
      const title = (item.employeeProfile?.jobTitle || "").toLowerCase();

      if (q && !fullName.includes(q) && !email.includes(q) && !title.includes(q)) {
        return false;
      }

      // 2. Department Filter
      if (departmentFilter !== "ALL") {
        if (item.employeeProfile?.department?.id !== departmentFilter) {
          return false;
        }
      }

      // 3. Role Filter
      if (roleFilter !== "ALL" && item.role !== roleFilter) {
        return false;
      }

      // 4. Onboarding Status Filter
      if (onboardingFilter !== "ALL") {
        const obs = item.employeeProfile?.onboardingStatus || "NOT_STARTED";
        if (obs !== onboardingFilter) return false;
      }

      // 5. Membership Status Filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }

      // 6. Batch Filter
      if (batchFilter !== "ALL") {
        if (item.employeeProfile?.batch?.id !== batchFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialMembers,
    search,
    departmentFilter,
    roleFilter,
    onboardingFilter,
    statusFilter,
    batchFilter,
  ]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      if (sortField === "name") {
        const nameA = (a.user.firstName || a.user.email).toLowerCase();
        const nameB = (b.user.firstName || b.user.email).toLowerCase();
        return sortDirection === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }

      if (sortField === "status") {
        return sortDirection === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }

      // Date sort
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [filteredItems, sortField, sortDirection]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  const handleSortToggle = (field: "name" | "createdAt" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "DEACTIVATED") {
      return (
        <Badge variant="warning" className="gap-1">
          <ShieldAlert className="w-3 h-3 text-amber-700" />
          Deactivated
        </Badge>
      );
    }
    return <Badge variant="success">Active</Badge>;
  };

  const getOnboardingBadge = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="coral">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters toolbar */}
      <div className="rounded-lg border border-surface-border bg-surface p-4 shadow-warm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search by name, email, or designation..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border border-surface-border bg-white pl-9 pr-3 py-2 text-sm text-brand-text placeholder:text-stone-400 focus:border-editorial-700 focus:outline-none focus:ring-1 focus:ring-editorial-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setDepartmentFilter("ALL");
                setRoleFilter("ALL");
                setOnboardingFilter("ALL");
                setStatusFilter("ALL");
                setBatchFilter("ALL");
                setCurrentPage(1);
              }}
              className="text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Filter Selects Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 rounded border border-surface-border bg-white px-2 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 rounded border border-surface-border bg-white px-2 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
            >
              <option value="ALL">All Roles</option>
              <option value="COMPANY_ADMIN">Company Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          <div>
            <select
              value={onboardingFilter}
              onChange={(e) => {
                setOnboardingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 rounded border border-surface-border bg-white px-2 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
            >
              <option value="ALL">All Onboarding</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 rounded border border-surface-border bg-white px-2 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>

          <div>
            <select
              value={batchFilter}
              onChange={(e) => {
                setBatchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-8 rounded border border-surface-border bg-white px-2 text-xs text-brand-text focus:outline-none focus:border-editorial-700"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-lg border border-surface-border bg-surface shadow-warm overflow-hidden">
        {sortedItems.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No employees match your search"
              description="Try adjusting your filter criteria or clear search terms to see all members."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border bg-canvas-subtle text-xs font-semibold uppercase text-brand-muted">
                <tr>
                  <th
                    className="px-4 py-3 cursor-pointer select-none hover:text-editorial-900"
                    onClick={() => handleSortToggle("name")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Employee</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Primary Manager</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Onboarding</th>
                  <th
                    className="px-4 py-3 cursor-pointer select-none hover:text-editorial-900"
                    onClick={() => handleSortToggle("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-stone-400" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-canvas-subtle/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-editorial-900">
                        {item.user.firstName
                          ? `${item.user.firstName} ${item.user.lastName || ""}`
                          : item.user.email}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {item.employeeProfile?.jobTitle || item.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="editorial">{item.role.replace("_", " ")}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-text">
                      {item.employeeProfile?.department?.name || "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {item.employeeProfile?.manager ? (
                        <span className="font-medium text-editorial-900">
                          {item.employeeProfile.manager.user.firstName
                            ? `${item.employeeProfile.manager.user.firstName} ${item.employeeProfile.manager.user.lastName || ""}`
                            : item.employeeProfile.manager.user.email}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-muted">
                      {item.employeeProfile?.batch ? (
                        <Badge variant="neutral">{item.employeeProfile.batch.name}</Badge>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getOnboardingBadge(item.employeeProfile?.onboardingStatus)}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/company/employees/${item.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          Manage
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {sortedItems.length > 0 && (
          <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 bg-canvas-subtle text-xs text-brand-muted">
            <div>
              Showing{" "}
              <span className="font-medium text-editorial-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-editorial-900">
                {Math.min(currentPage * pageSize, sortedItems.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-editorial-900">
                {sortedItems.length}
              </span>{" "}
              employees
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 px-2 text-xs gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </Button>
              <span className="text-xs font-mono">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 px-2 text-xs gap-1"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
