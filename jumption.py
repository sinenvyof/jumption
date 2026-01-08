import pygame
import random
import sys
import os
import json

# =====================
# INITIALIZE
# =====================
pygame.init()

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 300
GROUND_HEIGHT = 250
FPS = 60

# Physics
GRAVITY = 1
JUMP_HEIGHT = 15

# Difficulty
NORMAL_SPEED, NORMAL_INCREASE = 25, 0.3
FAST_SPEED, FAST_INCREASE = 50, 0.25
ULTRA_FAST_SPEED, ULTRA_FAST_INCREASE = 100, 0.7

# Themes
LIGHT_BG = (255, 255, 255)
LIGHT_FG = (0, 0, 0)
DARK_BG = (30, 30, 30)
DARK_FG = (220, 220, 220)

# Save file
SETTINGS_FILE = "settings.json"

# =====================
# SAVE / LOAD SETTINGS
# =====================
def load_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {"dark_mode": False}

def save_settings(settings):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f)

settings = load_settings()
dark_mode = settings["dark_mode"]

# =====================
# CLASSES
# =====================
class Rectangle:
    def __init__(self):
        self.x = 50
        self.y = GROUND_HEIGHT - 40
        self.width = 40
        self.height = 40
        self.vel_y = 0
        self.is_jumping = False

    def jump(self):
        if not self.is_jumping:
            self.vel_y = -JUMP_HEIGHT
            self.is_jumping = True

    def update(self):
        self.vel_y += GRAVITY
        self.y += self.vel_y
        if self.y >= GROUND_HEIGHT - self.height:
            self.y = GROUND_HEIGHT - self.height
            self.is_jumping = False
            self.vel_y = 0

    def draw(self, screen, color):
        pygame.draw.rect(screen, color, (self.x, self.y, self.width, self.height))


class Cactus:
    def __init__(self, x, speed):
        self.x = x
        self.y = GROUND_HEIGHT - 30
        self.width = 20
        self.height = 30
        self.speed = speed

    def update(self):
        self.x -= self.speed

    def draw(self, screen, color):
        pygame.draw.rect(screen, color, (self.x, self.y, self.width, self.height))

    def off_screen(self):
        return self.x < -self.width

# =====================
# FADE ANIMATION
# =====================
def fade(screen, bg_color):
    fade_surface = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    fade_surface.fill(bg_color)
    for alpha in range(0, 255, 15):
        fade_surface.set_alpha(alpha)
        screen.blit(fade_surface, (0, 0))
        pygame.display.update()
        pygame.time.delay(10)

# =====================
# START MENU
# =====================
def start_screen(screen, font):
    global dark_mode
    clock = pygame.time.Clock()

    while True:
        bg = DARK_BG if dark_mode else LIGHT_BG
        fg = DARK_FG if dark_mode else LIGHT_FG
        screen.fill(bg)

        title = font.render("Select Difficulty", True, fg)
        screen.blit(title, title.get_rect(center=(SCREEN_WIDTH//2, 60)))

        options = [
            "1 - Normal",
            "2 - Fast",
            "3 - Ultra Fast",
            "D - Toggle Dark Mode",
            "ESC - Quit"
        ]

        for i, text in enumerate(options):
            t = font.render(text, True, fg)
            screen.blit(t, t.get_rect(center=(SCREEN_WIDTH//2, 120 + i*35)))

        # Dark mode indicator 🌙
        indicator = "🌙 Dark Mode ON" if dark_mode else "☀ Light Mode"
        ind_text = font.render(indicator, True, fg)
        screen.blit(ind_text, (10, 10))

        pygame.display.flip()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_1:
                    fade(screen, bg)
                    return NORMAL_SPEED, NORMAL_INCREASE
                if event.key == pygame.K_2:
                    fade(screen, bg)
                    return FAST_SPEED, FAST_INCREASE
                if event.key == pygame.K_3:
                    fade(screen, bg)
                    return ULTRA_FAST_SPEED, ULTRA_FAST_INCREASE
                if event.key == pygame.K_d:
                    dark_mode = not dark_mode
                    settings["dark_mode"] = dark_mode
                    save_settings(settings)
                    fade(screen, bg)
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    sys.exit()

        clock.tick(FPS)

# =====================
# MAIN GAME
# =====================
def main():
    global dark_mode

    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Jumption")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont(None, 28)

    speed, speed_inc = start_screen(screen, font)

    rectangle = Rectangle()
    cacti = []
    score = 0
    timer = 0
    game_over = False

    while True:
        bg = DARK_BG if dark_mode else LIGHT_BG
        fg = DARK_FG if dark_mode else LIGHT_FG

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.KEYDOWN:
                if event.key in (pygame.K_SPACE, pygame.K_UP):
                    rectangle.jump()
                if event.key == pygame.K_d:
                    dark_mode = not dark_mode
                    settings["dark_mode"] = dark_mode
                    save_settings(settings)
                    fade(screen, bg)
                if game_over and event.key == pygame.K_r:
                    fade(screen, bg)
                    main()

        if not game_over:
            rectangle.update()
            timer += 1

            if timer > random.randint(50, 100):
                cacti.append(Cactus(SCREEN_WIDTH, speed))
                timer = 0

            for cactus in cacti[:]:
                cactus.update()
                if cactus.off_screen():
                    cacti.remove(cactus)
                    score += 1
                if (
                    rectangle.x + rectangle.width > cactus.x and
                    rectangle.x < cactus.x + cactus.width and
                    rectangle.y + rectangle.height > cactus.y
                ):
                    game_over = True

            speed += speed_inc / FPS
            for c in cacti:
                c.speed = speed

        # DRAW
        screen.fill(bg)
        pygame.draw.line(screen, fg, (0, GROUND_HEIGHT), (SCREEN_WIDTH, GROUND_HEIGHT), 2)

        rectangle.draw(screen, fg)
        for cactus in cacti:
            cactus.draw(screen, fg)

        screen.blit(font.render(f"Score: {score}", True, fg), (SCREEN_WIDTH - 150, 10))
        screen.blit(font.render("D = Toggle Dark Mode", True, fg), (10, SCREEN_HEIGHT - 30))

        if game_over:
            go = font.render("Game Over! Press R to Restart", True, fg)
            screen.blit(go, go.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2)))

        pygame.display.flip()
        clock.tick(FPS)

# =====================
# RUN
# =====================
if __name__ == "__main__":
    main()
