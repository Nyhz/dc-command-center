"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassIcon } from "@/components/shared/class-icon";
import { RoleBadge } from "@/components/shared/role-badge";
import { CLASS_COLORS, WOW_CLASSES } from "@/lib/constants";
import { ArrowUpDown, Search } from "lucide-react";

interface RosterCharacter {
  id: string;
  name: string;
  realm: string;
  className: string;
  specName: string | null;
  raidRole: string;
  itemLevel: number;
  isMain: boolean;
  user: { id: string; name: string | null; battleTag: string | null } | null;
}

type SortKey = "name" | "className" | "raidRole" | "itemLevel";

export function RosterTable({ characters }: { characters: RosterCharacter[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let result = characters;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.user?.battleTag?.toLowerCase().includes(q)
      );
    }

    if (classFilter !== "all") {
      result = result.filter((c) => c.className === classFilter);
    }

    if (roleFilter !== "all") {
      result = result.filter((c) => c.raidRole === roleFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "className") cmp = a.className.localeCompare(b.className);
      else if (sortKey === "raidRole") cmp = a.raidRole.localeCompare(b.raidRole);
      else if (sortKey === "itemLevel") cmp = a.itemLevel - b.itemLevel;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [characters, search, classFilter, roleFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classFilter} onValueChange={(v) => v && setClassFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {WOW_CLASSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => v && setRoleFilter(v)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="TANK">Tank</SelectItem>
            <SelectItem value="HEALER">Healer</SelectItem>
            <SelectItem value="DPS">DPS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Character <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("className")}
              >
                <span className="flex items-center gap-1">
                  Class <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead>Spec</TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => toggleSort("raidRole")}
              >
                <span className="flex items-center gap-1">
                  Role <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => toggleSort("itemLevel")}
              >
                <span className="flex items-center justify-end gap-1">
                  iLvl <ArrowUpDown className="h-3 w-3" />
                </span>
              </TableHead>
              <TableHead>Player</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No characters found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((char) => (
                <TableRow key={char.id} className="hover:bg-accent/50">
                  <TableCell>
                    <Link
                      href={`/roster/${char.id}`}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <ClassIcon className={char.className} />
                      <span style={{ color: CLASS_COLORS[char.className] }}>
                        {char.name}
                      </span>
                      {char.isMain && (
                        <span className="text-xs text-muted-foreground">(Main)</span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell
                    style={{ color: CLASS_COLORS[char.className] }}
                  >
                    {char.className}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {char.specName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={char.raidRole} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {char.itemLevel > 0 ? char.itemLevel : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {char.user?.battleTag ?? char.user?.name ?? "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} character{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
