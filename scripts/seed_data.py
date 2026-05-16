"""Seed the local bandw server with realistic experiment data."""

import math
import random

import wandb

API_KEY = "1dbac5a5d91172ad159b7978bec36bb8c3b0a5f5"  # gitleaks:allow - local dev key
HOST = "http://localhost:8080"

wandb.login(key=API_KEY, host=HOST)


def seed_image_classifier():
    """A ResNet image classification training run."""
    run = wandb.init(
        project="image-classification",
        name="resnet50-baseline",
        config={
            "model": "resnet50",
            "dataset": "cifar10",
            "epochs": 30,
            "batch_size": 128,
            "learning_rate": 0.01,
            "optimizer": "sgd",
            "weight_decay": 1e-4,
        },
        tags=["baseline", "resnet"],
    )
    for epoch in range(30):
        t = epoch / 29
        train_loss = 2.3 * math.exp(-3 * t) + 0.15 + random.gauss(0, 0.02)
        val_loss = 2.3 * math.exp(-2.5 * t) + 0.25 + random.gauss(0, 0.03)
        train_acc = 0.95 * (1 - math.exp(-3 * t)) + random.gauss(0, 0.005)
        val_acc = 0.90 * (1 - math.exp(-2.5 * t)) + random.gauss(0, 0.008)
        run.log(
            {
                "epoch": epoch + 1,
                "train/loss": max(0, train_loss),
                "train/accuracy": min(1, max(0, train_acc)),
                "val/loss": max(0, val_loss),
                "val/accuracy": min(1, max(0, val_acc)),
                "learning_rate": 0.01 * (0.95**epoch),
            }
        )
    run.finish()


def seed_image_classifier_v2():
    """A second run with different hyperparams."""
    run = wandb.init(
        project="image-classification",
        name="resnet50-cosine-lr",
        config={
            "model": "resnet50",
            "dataset": "cifar10",
            "epochs": 30,
            "batch_size": 256,
            "learning_rate": 0.1,
            "optimizer": "sgd",
            "lr_schedule": "cosine",
            "weight_decay": 5e-4,
        },
        tags=["cosine-lr", "resnet"],
    )
    for epoch in range(30):
        t = epoch / 29
        lr = 0.1 * 0.5 * (1 + math.cos(math.pi * t))
        train_loss = 2.0 * math.exp(-4 * t) + 0.10 + random.gauss(0, 0.015)
        val_loss = 2.0 * math.exp(-3 * t) + 0.20 + random.gauss(0, 0.025)
        train_acc = 0.96 * (1 - math.exp(-4 * t)) + random.gauss(0, 0.004)
        val_acc = 0.92 * (1 - math.exp(-3 * t)) + random.gauss(0, 0.007)
        run.log(
            {
                "epoch": epoch + 1,
                "train/loss": max(0, train_loss),
                "train/accuracy": min(1, max(0, train_acc)),
                "val/loss": max(0, val_loss),
                "val/accuracy": min(1, max(0, val_acc)),
                "learning_rate": lr,
            }
        )
    run.finish()


def seed_nlp_finetuning():
    """An NLP fine-tuning run."""
    run = wandb.init(
        project="nlp-finetuning",
        name="bert-base-sst2",
        config={
            "model": "bert-base-uncased",
            "dataset": "sst2",
            "max_length": 128,
            "epochs": 5,
            "batch_size": 32,
            "learning_rate": 2e-5,
            "warmup_steps": 500,
        },
        tags=["bert", "sentiment"],
    )
    steps = 0
    for epoch in range(5):
        for _batch in range(50):
            steps += 1
            t = steps / 250
            loss = 0.7 * math.exp(-2 * t) + 0.05 + random.gauss(0, 0.01)
            run.log(
                {
                    "step": steps,
                    "epoch": epoch + 1,
                    "train/loss": max(0, loss),
                    "train/accuracy": min(1, 0.93 * (1 - math.exp(-3 * t)) + random.gauss(0, 0.005)),
                }
            )
        # End-of-epoch eval
        val_acc = 0.91 * (1 - math.exp(-2 * (epoch + 1) / 5)) + random.gauss(0, 0.005)
        run.log(
            {
                "epoch": epoch + 1,
                "eval/accuracy": min(1, max(0, val_acc)),
                "eval/f1": min(1, max(0, val_acc - 0.01 + random.gauss(0, 0.003))),
            }
        )
    run.finish()


def seed_gan_training():
    """A GAN training run with generator/discriminator losses."""
    run = wandb.init(
        project="generative-models",
        name="dcgan-celeba",
        config={
            "model": "dcgan",
            "dataset": "celeba",
            "latent_dim": 100,
            "epochs": 20,
            "batch_size": 64,
            "lr_g": 2e-4,
            "lr_d": 2e-4,
            "beta1": 0.5,
        },
        tags=["gan", "dcgan"],
    )
    for epoch in range(20):
        for step in range(100):
            g_loss = 2.0 + 0.5 * math.sin(0.05 * (epoch * 100 + step)) + random.gauss(0, 0.2)
            d_loss = 0.7 + 0.3 * math.cos(0.05 * (epoch * 100 + step)) + random.gauss(0, 0.15)
            d_real = 0.8 + 0.15 * math.tanh(0.01 * (epoch * 100 + step)) + random.gauss(0, 0.05)
            d_fake = 0.2 - 0.15 * math.tanh(0.01 * (epoch * 100 + step)) + random.gauss(0, 0.05)
            run.log(
                {
                    "epoch": epoch + 1,
                    "generator/loss": max(0, g_loss),
                    "discriminator/loss": max(0, d_loss),
                    "discriminator/real_score": min(1, max(0, d_real)),
                    "discriminator/fake_score": min(1, max(0, d_fake)),
                }
            )
    run.finish()


if __name__ == "__main__":
    random.seed(42)
    print("Seeding image-classification project...")
    seed_image_classifier()
    print("Seeding image-classification v2...")
    seed_image_classifier_v2()
    print("Seeding nlp-finetuning project...")
    seed_nlp_finetuning()
    print("Seeding generative-models project...")
    seed_gan_training()
    print("Done! Seed data created.")
