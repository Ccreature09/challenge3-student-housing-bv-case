import React from 'react'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/sidebar'
import { Table, TableHead, TableBody, TableCaption, TableCell, TableFooter, TableHeader, TableRow } from '@/components/ui/table'
export default function page() {
  return (
    <div>
       <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
      <SidebarTrigger />
      
      
      
      
      
      
      
    <Table>
  <TableCaption>A list of your recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[100px]">Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Method</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>Credit Card</TableCell>
      <TableCell className="text-right">$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>





      </SidebarInset>
 </SidebarProvider>





</div>
  )
}
