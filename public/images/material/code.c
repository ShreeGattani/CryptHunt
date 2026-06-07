#include <stdio.h>

int main(void) {
    unsigned char encrypted[] = {
        0x16, 0x1B, 0x0F, 0x1D, 0x12,
        0x13, 0x14, 0x1D, 0x09
    };

    unsigned char key = 0x5A;

    for (int i = 0; i < sizeof(encrypted); i++) {
        unsigned char decoded = encrypted[i] ^ key;
        printf("%02X", decoded);
    }

    printf("\n");
    return 0;
}