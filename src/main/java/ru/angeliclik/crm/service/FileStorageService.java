package ru.angeliclik.crm.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path uploadDir = Paths.get("uploads", "clients").toAbsolutePath();

    public String saveClientPhoto(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл не выбран");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("Размер фотографии не должен превышать 5 МБ");
        }

        String contentType = file.getContentType();

        if (!"image/jpeg".equals(contentType) && !"image/png".equals(contentType)) {
            throw new IllegalArgumentException("Разрешены только JPG и PNG");
        }

        BufferedImage image = ImageIO.read(file.getInputStream());

        if (image == null || image.getWidth() > 6000 || image.getHeight() > 6000) {
            throw new IllegalArgumentException("Некорректное изображение или слишком большое разрешение");
        }

        String extension = "image/png".equals(contentType) ? ".png" : ".jpg";
        String filename = UUID.randomUUID() + extension;

        Files.createDirectories(uploadDir);
        Path target = uploadDir.resolve(filename).normalize();

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/clients/" + filename;
    }
}