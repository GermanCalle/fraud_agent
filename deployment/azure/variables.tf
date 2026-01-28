variable "prefix" {
  description = "Prefix for all resources"
  default     = "tracefraud"
}

variable "location" {
  description = "Azure region"
  default     = "East US"
}

variable "github_username" {
  description = "GitHub username for container registry"
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  sensitive   = true
}

variable "tavily_api_key" {
  description = "Tavily API Key"
  sensitive   = true
}


variable "github_pat" {
  type      = string
  sensitive = true
}

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

