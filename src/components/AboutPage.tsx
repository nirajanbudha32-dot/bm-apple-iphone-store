import { Shield, Building2, Lock, FileText, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AboutPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* SECTION 1: App Identity */}
      <div
        style={{
          background: "#1A1A2E",
          borderRadius: "12px",
          padding: "40px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: "#FFFFFF",
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          BM Store
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "#8888AA",
            margin: "8px 0 16px 0",
          }}
        >
          Multi-Store Retail Management System
        </p>
        <Badge
          variant="secondary"
          style={{
            fontSize: "12px",
            padding: "4px 14px",
            background: "#2A2A4E",
            color: "#AAAACC",
            border: "1px solid #3A3A5E",
          }}
        >
          v1.0.0
        </Badge>
        <p
          style={{
            fontSize: "12px",
            color: "#666688",
            marginTop: "16px",
          }}
        >
          © 2026 BM Electronic. All Rights Reserved.
        </p>
      </div>

      {/* SECTION 2: Ownership & Copyright */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="size-5 text-primary" />
            Ownership &amp; Copyright
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            This software application (&quot;BM Store&quot;) including all its source code,
            database schemas, modules, reports, and associated documentation is the
            exclusive intellectual property of <strong className="text-foreground">BM Electronic</strong>, Birendranagar,
            Surkhet, Nepal.
          </p>
          <p className="font-semibold text-foreground">
            © 2026 BM Electronic. All Rights Reserved.
          </p>
          <p>
            Reproduction, distribution, modification, reverse engineering, or
            unauthorized use of this software or any part thereof is strictly
            prohibited without prior written permission from BM Electronic.
          </p>
          <p>
            Unauthorized access to this system may result in civil and criminal
            liability under applicable laws of Nepal.
          </p>
        </CardContent>
      </Card>

      {/* SECTION 3: Data Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="size-5 text-primary" />
            Data Privacy &amp; Confidentiality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>BM Store collects and stores the following data for business operations:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Customer names, contact details, and PAN/VAT numbers</li>
            <li>Transaction records: sales, purchases, payments, and returns</li>
            <li>Product inventory including IMEI/serial numbers</li>
            <li>Vendor information and financial records</li>
            <li>Staff activity logs and audit trails</li>
          </ul>
          <p>
            All data stored in this system is the confidential property of
            BM Electronic. Access is restricted to authorized personnel only.
          </p>
          <p>
            Data is stored securely on Supabase (PostgreSQL) with Row Level
            Security (RLS) enforced on all tables. Each user can only access
            data permitted by their assigned role.
          </p>
          <p>
            Staff must not share, export, screenshot, or transmit any data from
            this system without written authorization from management.
          </p>
        </CardContent>
      </Card>

      {/* SECTION 4: Terms of Use */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="size-5 text-primary" />
            Terms of Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>By using BM Store, all users agree to the following:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>This system is for authorized BM Electronic staff only.</li>
            <li>Login credentials must not be shared with any other person.</li>
            <li>All actions performed in this system are logged and audited.</li>
            <li>Financial data must not be altered without proper authorization.</li>
            <li>
              Any attempt to bypass security, export data, or tamper with
              records is a serious violation and will result in immediate
              termination and legal action.
            </li>
            <li>
              The system must be used only for legitimate business purposes
              of BM Electronic and its stores.
            </li>
            <li>
              Staff are responsible for all transactions entered under their
              login credentials.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* SECTION 5: System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="size-5 text-primary" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {[
                ["Application Name", "BM Store"],
                ["Version", "1.0.0"],
                ["Owner", "BM Electronic"],
                ["Address", "Birendranagar, Surkhet, Nepal"],
                ["Stores", "BM Apple iPhone Store | BM iPhone Store | BM Electronic | Warehouse"],
                ["Technology", "React 19 + TypeScript + Supabase (PostgreSQL)"],
                ["Database", "Supabase — Row Level Security Enabled"],
                ["Developed", "2026"],
                ["Support Contact", "Management Contact Number"],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-border/40">
                  <td className="py-2.5 pr-4 font-medium text-muted-foreground w-[180px]">
                    {label}
                  </td>
                  <td className="py-2.5 text-foreground">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
