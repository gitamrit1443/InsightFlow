import os

from app.core.config import settings


def download_transformer() -> None:
    os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
    from transformers import AutoTokenizer, TFAutoModel

    settings.nlp_model_cache_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = str(settings.nlp_model_cache_dir)
    print(f"Downloading {settings.nlp_transformer_model} to {cache_dir}...")
    AutoTokenizer.from_pretrained(settings.nlp_transformer_model, cache_dir=cache_dir)
    TFAutoModel.from_pretrained(settings.nlp_transformer_model, cache_dir=cache_dir)
    print("Transformer model is cached and ready.")


if __name__ == "__main__":
    download_transformer()
