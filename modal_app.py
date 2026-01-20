import modal

# Define the Modal app
app = modal.App("paper-grader-backend")

# Define the image with all required dependencies
image = (
    modal.Image.debian_slim()
    .pip_install(
        "fastapi",
        "uvicorn[standard]",
        "pillow",
        "sentence-transformers",
        "google-generativeai",
        "python-multipart",
    )
)

@app.function(
    image=image,
    secrets=[modal.Secret.from_name("gemini-api-key")],
)
@modal.asgi_app()
def fastapi_app():
    """Expose the FastAPI app defined in main.py as an ASGI app for Modal."""
    from main import app as fastapi_app_instance
    return fastapi_app_instance
