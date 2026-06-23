package com.example.pizzachaongon.service;

import com.example.pizzachaongon.dto.SettingDto;
import com.example.pizzachaongon.entity.Setting;
import com.example.pizzachaongon.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettingService {
    private final SettingRepository settingRepository;

    @Transactional(readOnly = true)
    public List<SettingDto> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(s -> new SettingDto(s.getKey(), s.getValue()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public String getSettingValue(String key) {
        return settingRepository.findByKey(key)
                .map(Setting::getValue)
                .orElse(null);
    }

    @Transactional
    public void saveSettings(List<SettingDto> settings) {
        for (SettingDto dto : settings) {
            Optional<Setting> opt = settingRepository.findByKey(dto.getKey());
            if (opt.isPresent()) {
                Setting setting = opt.get();
                setting.setValue(dto.getValue());
            } else {
                Setting setting = Setting.builder()
                        .key(dto.getKey())
                        .value(dto.getValue())
                        .build();
                settingRepository.save(setting);
            }
        }
    }
}
