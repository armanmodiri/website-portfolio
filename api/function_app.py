import azure.functions as func
import logging
import os
import json
from azure.data.tables import TableClient
from azure.core.exceptions import ResourceNotFoundError

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

@app.route(route="GetVisitorCount")
def GetVisitorCount(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing visitor counter request.')

    # 1. RETRIEVE CONNECTION STRING SAFELY
    # This pulls the value from local.settings.json (local) or App Settings (Cloud)
    connection_string = os.environ.get("COSMOS_CONNECTION_STRING")

    if not connection_string:
        return func.HttpResponse(
            "Server Error: Connection string not configured.",
            status_code=500
        )

    # 2. DEFINE TABLE AND ENTITY DETAILS
    table_name = "VisitorStats"
    partition_key = "site-stats"
    row_key = "visitor-counter"

    try:
        # 3. CONNECT TO THE TABLE SERVICE
        table_client = TableClient.from_connection_string(
            conn_str=connection_string, 
            table_name=table_name
        )

        # 4. GET OR CREATE THE COUNTER
        try:
            # Try to get the existing entity
            entity = table_client.get_entity(partition_key=partition_key, row_key=row_key)
            current_count = entity["count"]
            
            # Increment
            new_count = current_count + 1
            entity["count"] = new_count
            
            # Update the database
            table_client.update_entity(mode="replace", entity=entity)
            logging.info(f"Counter incremented to {new_count}")

        except ResourceNotFoundError:
            # If the entity doesn't exist yet (first run), create it
            logging.info("Counter not found. Creating new counter.")
            new_count = 1
            new_entity = {
                "PartitionKey": partition_key,
                "RowKey": row_key,
                "count": new_count
            }
            table_client.create_entity(entity=new_entity)

        # 5. RETURN THE RESULT TO THE FRONTEND
        # We return JSON so your JavaScript can parse it easily
        response_body = {
            "count": new_count
        }
        
        return func.HttpResponse(
            json.dumps(response_body),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Error updating visitor count: {str(e)}")
        return func.HttpResponse(
            "Error processing request",
            status_code=500
        )