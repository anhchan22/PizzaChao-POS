package com.example.pizzachaongon.repository;

import com.example.pizzachaongon.entity.Shift;
import com.example.pizzachaongon.enums.ShiftStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByStatus(ShiftStatus status);
}
