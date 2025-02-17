package org.com.aqoo.util;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

import java.io.IOException;
import java.text.DecimalFormat;

public class CustomDoubleSerializer extends JsonSerializer<Double> {
    private static final DecimalFormat df = new DecimalFormat("0.00"); // 소수점 2자리 강제 유지

    @Override
    public void serialize(Double value, JsonGenerator gen, SerializerProvider serializers) throws IOException {
        if (value == null) {
            gen.writeNull();
        } else {
            gen.writeNumber(df.format(value)); // "57.00" -> 57.00 (문자열 아님)
        }
    }
}