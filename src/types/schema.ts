export interface TableColumn {
  column_name: string
  data_type: string
  is_nullable: string
}

export interface TableSchema {
  table_name: string
  columns: TableColumn[]
}
