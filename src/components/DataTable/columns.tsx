
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"

export type ImageRecord = {
  id: string
  code: string | null
  sender_name: string | null
  province: string | null
  price: string | null
  phone_number: string | null
  company_name: string | null
  created_at: string
  preview_url: string | null
}

export const columns: ColumnDef<ImageRecord>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="px-0"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          رمز الإعلان
          <ArrowUpDown className="mr-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("code") || "غير متوفر"}</div>,
  },
  {
    accessorKey: "sender_name",
    header: "اسم المعلن",
    cell: ({ row }) => <div>{row.getValue("sender_name") || "غير متوفر"}</div>,
  },
  {
    accessorKey: "province",
    header: "المنطقة",
    cell: ({ row }) => <div>{row.getValue("province") || "غير متوفر"}</div>,
  },
  {
    accessorKey: "price",
    header: "السعر",
    cell: ({ row }) => <div>{row.getValue("price") || "غير متوفر"}</div>,
  },
  {
    accessorKey: "phone_number",
    header: "رقم الهاتف",
    cell: ({ row }) => <div dir="ltr">{row.getValue("phone_number") || "غير متوفر"}</div>,
  },
  {
    accessorKey: "created_at",
    header: "تاريخ الإضافة",
    cell: ({ row }) => {
      const date = row.getValue<string>("created_at")
      return date ? (
        <div>
          {format(new Date(date), "dd MMMM yyyy", { locale: ar })}
        </div>
      ) : (
        "غير متوفر"
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/image/${row.original.id}`}>
              <Eye className="h-4 w-4 ml-2" />
              عرض التفاصيل
            </Link>
          </Button>
        </div>
      )
    },
  },
]
