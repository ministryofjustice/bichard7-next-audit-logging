type PostgresConfig = {
  HOST: string
  PORT: number
  USERNAME: string
  PASSWORD: string
  DATABASE_NAME: string
  TABLE_NAME?: string
  SSL: boolean
}

export default PostgresConfig
