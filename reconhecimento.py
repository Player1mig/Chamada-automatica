import os
import cv2
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))

detector = cv2.FaceDetectorYN.create(
    os.path.join(BASE, "modelos", "face_detection_yunet_2023mar.onnx"),
    "", (320, 320), 0.8, 0.3, 5000
)
reconhecedor = cv2.FaceRecognizerSF.create(
    os.path.join(BASE, "modelos", "face_recognition_sface_2021dec.onnx"), ""
)

# acima desse valor, consideramos que é a mesma pessoa (0.363 é o valor da documentação do OpenCV)
LIMITE = 0.363


def gerar_embedding(bytes_imagem):
    """Recebe os bytes de uma imagem e devolve (embedding, erro)."""
    dados = np.frombuffer(bytes_imagem, np.uint8)
    imagem = cv2.imdecode(dados, cv2.IMREAD_COLOR)
    if imagem is None:
        return None, "Imagem inválida."

    altura, largura = imagem.shape[:2]
    detector.setInputSize((largura, altura))
    _, rostos = detector.detect(imagem)

    if rostos is None:
        return None, "Nenhum rosto encontrado. Olhe para a câmera."
    if len(rostos) > 1:
        return None, "Apareceu mais de um rosto. Fique só uma pessoa na câmera."

    alinhado = reconhecedor.alignCrop(imagem, rostos[0])
    embedding = reconhecedor.feature(alinhado)
    return embedding.astype(np.float32), None


def semelhanca(emb1, emb2):
    return reconhecedor.match(emb1, emb2, cv2.FaceRecognizerSF_FR_COSINE)